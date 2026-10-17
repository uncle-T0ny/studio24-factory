import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import { WRONG_STAGE } from "./lib/access"
import { FIXTURE_TRANSCRIPT } from "./lib/fixtureTranscript"
import { SEEDED_TEMPLATE } from "./lib/seededTemplate"
import { type TranscriptLine } from "./lib/transcript"
import { newBackend, OWNER_EMAILS, projectWithLink, signedIn, type TestBackend } from "./test.setup"

async function interviewed(t: TestBackend, turns: TranscriptLine[]) {
  const owner = await signedIn(t, "owner@example.com")
  const link = await projectWithLink(t, owner.userId, ["interview", "prd", "analysis"])

  await t.run(async (ctx) => {
    const interviewId = await ctx.db.insert("interviews", {
      projectId: link.projectId,
      linkId: link.linkId,
      mode: "text",
      status: "done",
    })
    for (const turn of turns) {
      await ctx.db.insert("transcriptTurns", {
        ...turn,
        interviewId,
        projectId: link.projectId,
        at: turn.seq,
      })
    }
  })
  return { owner, ...link }
}

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
  vi.stubEnv("OPENROUTER_API_KEY", "")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("the PRD stage", () => {
  it("drafts the PRD from the interview, labelled recorded, the paraphrased quote unverified", async () => {
    const t = newBackend()
    const { token } = await interviewed(t, FIXTURE_TRANSCRIPT)

    expect(await t.query(api.prd.forClient, { token })).toBeNull()
    await t.action(api.prd.draft, { token })
    const view = await t.query(api.prd.forClient, { token })

    expect(view?.recorded).toBe(true)
    expect(view?.prd.validation).toEqual({ ok: true, problems: [] })
    expect(view?.requirements.map((requirement) => requirement.code)).toEqual([
      "FR-1",
      "FR-2",
      "FR-3",
      "FR-4",
      "FR-5",
      "FR-6",
      "NFR-1",
      "NFR-2",
      "NFR-3",
    ])
    const unverified = view?.requirements.filter((requirement) =>
      requirement.quotes.some((quote) => !quote.verified),
    )
    expect(unverified?.map((requirement) => requirement.code)).toEqual(["NFR-2"])
    expect(view?.decisions).toHaveLength(2)
  })

  it("refuses to draft before the client has answered", async () => {
    const t = newBackend()
    const { token } = await interviewed(t, FIXTURE_TRANSCRIPT.slice(0, 1))

    await expect(t.action(api.prd.draft, { token })).rejects.toThrow(
      "The interview has no answers yet.",
    )
  })

  it("refuses the PRD and the estimate to a link that doesn't open their stages", async () => {
    const t = newBackend()
    const owner = await signedIn(t, "owner@example.com")
    const { token } = await projectWithLink(t, owner.userId, ["interview"])

    await expect(t.action(api.prd.draft, { token })).rejects.toThrow(WRONG_STAGE)
    await expect(t.query(api.prd.forClient, { token })).rejects.toThrow(WRONG_STAGE)
    await expect(t.action(api.estimates.run, { token })).rejects.toThrow(WRONG_STAGE)
    await expect(t.query(api.estimates.forClient, { token })).rejects.toThrow(WRONG_STAGE)
  })
})

describe("the analysis stage", () => {
  it("estimates against the seeded starter when the developer added no template", async () => {
    const t = newBackend()
    const { token } = await interviewed(t, FIXTURE_TRANSCRIPT)

    await expect(t.action(api.estimates.run, { token })).rejects.toThrow("Draft the PRD first.")
    await t.action(api.prd.draft, { token })
    await t.action(api.estimates.run, { token })
    await t.action(api.estimates.run, { token })
    const view = await t.query(api.estimates.forClient, { token })

    expect(view?.templateName).toBe(SEEDED_TEMPLATE.name)
    expect(view?.estimate).toMatchObject({ totalHours: 46, infraMonthlyUsd: 0 })
    expect(view?.estimate.freeTierBreaks.map((jump) => jump.service)).toEqual(["Convex"])
    expect(view?.verdicts).toHaveLength(9)
    const rows = await t.run(async (ctx) => ({
      verdicts: await ctx.db.query("verdicts").collect(),
      templates: await ctx.db.query("templates").collect(),
    }))
    expect(rows.verdicts).toHaveLength(9)
    expect(rows.templates).toHaveLength(1)
  })

  it("adds a template by link for the developer, the seeded manifest standing in when GitHub fails", async () => {
    const t = newBackend()
    const owner = await signedIn(t, "owner@example.com")
    const stranger = await signedIn(t, "stranger@example.com")
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("Not Found", { status: 404 })))

    const added = await owner.as.action(api.templates.addByLink, {
      repoUrl: "https://github.com/example/starter",
    })

    expect(added.problem).toBe("GitHub didn't return the repository's README.")
    expect(await owner.as.query(api.templates.listMine, {})).toMatchObject([
      { name: "example/starter", source: "seeded", status: "ready" },
    ])
    await expect(
      stranger.as.action(api.templates.addByLink, { repoUrl: "https://github.com/a/b" }),
    ).rejects.toThrow("Not allowed")
  })
})
