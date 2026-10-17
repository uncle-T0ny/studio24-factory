import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { internal } from "./_generated/api"
import { findClientAccess } from "./lib/access"
import { newBackend, type TestBackend } from "./test.setup"

const EMAIL = "demo@example.com"

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", EMAIL)
  vi.stubEnv("DEMO_OWNER_EMAIL", EMAIL)
  vi.stubEnv("DEMO_OWNER_PASSWORD", "a-generated-local-password")
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("seed.run", () => {
  it("creates the demo owner once, and a re-run reuses her", async () => {
    const t = newBackend()
    const first = await t.action(internal.seed.run, {})
    const second = await t.action(internal.seed.run, {})

    expect(first).toMatchObject({ email: EMAIL, created: true })
    expect(second).toEqual({ ...first, created: false, link: second.link })
    expect(await t.query(internal.seed.owner, {})).toEqual({
      email: EMAIL,
      ownerId: first.ownerId,
    })

    const accounts = await t.run(async (ctx) => await ctx.db.query("authAccounts").collect())

    expect(accounts).toHaveLength(1)
    expect(accounts[0]?.secret).not.toContain("a-generated-local-password")
  })

  it("refuses without the demo owner's settings, or when she isn't an owner", async () => {
    const t = newBackend()

    vi.stubEnv("DEMO_OWNER_PASSWORD", "")
    await expect(t.action(internal.seed.run, {})).rejects.toThrow("DEMO_OWNER_PASSWORD")

    vi.stubEnv("DEMO_OWNER_PASSWORD", "a-generated-local-password")
    vi.stubEnv("OWNER_EMAILS", "someone-else@example.com")
    await expect(t.action(internal.seed.run, {})).rejects.toThrow("OWNER_EMAILS")
  })
})

async function opens(t: TestBackend, token: string) {
  return await t.run(async (ctx) => (await findClientAccess(ctx, token))?.link.stages ?? null)
}

describe("the demo data", () => {
  it("seeds one empty demo client at the interview stage, with a link for each client stage", async () => {
    const t = newBackend()
    const { ownerId, link } = await t.action(internal.seed.run, {})

    await t.action(internal.seed.run, {})

    const seeded = await t.run(async (ctx) => ({
      projects: await ctx.db.query("projects").collect(),
      links: await ctx.db.query("clientLinks").collect(),
      events: await ctx.db.query("stageEvents").collect(),
      turns: await ctx.db.query("transcriptTurns").collect(),
    }))

    expect(seeded.projects).toEqual([
      expect.objectContaining({ ownerId, clientName: "Demo client", slug: "demo-client" }),
    ])
    expect(seeded.projects[0]).toMatchObject({ stage: "interview", isDemo: true })
    expect(seeded.links.map((row) => row.stages)).toEqual([
      ["interview"],
      ["prd"],
      ["analysis"],
      ["prototype"],
      ["feedback"],
      ["final"],
    ])
    expect(seeded.links.find((row) => row.stages.includes("final"))?.requiresLogin).toBe(true)
    expect(seeded.events.filter((event) => event.status === "active")).toHaveLength(1)
    expect(seeded.turns).toEqual([])
    expect(link.stage).toBe("interview")
  })

  it("prints a working link on every run, and the new one replaces the old", async () => {
    const t = newBackend()
    const first = await t.action(internal.seed.run, {})
    const second = await t.action(internal.seed.run, {})

    expect(await opens(t, second.link.token)).toEqual(["interview"])
    expect(await opens(t, first.link.token)).toBeNull()
  })

  it("reseeds the demo client back to an empty interview, and its link works", async () => {
    const t = newBackend()

    await t.action(internal.seed.run, {})
    await t.run(async (ctx) => {
      const project = await ctx.db.query("projects").first()

      await ctx.db.patch(project!._id, { stage: "prd" })
    })

    const link = await t.mutation(internal.seed.reseed, {})
    const projects = await t.run(async (ctx) => await ctx.db.query("projects").collect())

    expect(projects).toHaveLength(1)
    expect(projects[0]).toMatchObject({ slug: "demo-client", stage: "interview" })
    expect(link.stage).toBe("interview")
    expect(await opens(t, link.token)).toEqual(["interview"])
  })
})
