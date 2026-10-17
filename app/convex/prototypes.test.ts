import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api, internal } from "./_generated/api"
import { WRONG_STAGE } from "./lib/access"
import { newBackend, OWNER_EMAILS, projectWithLink, signedIn } from "./test.setup"

async function fixture() {
  const t = newBackend()
  const owner = await signedIn(t, "owner@example.com")
  const { projectId, token } = await projectWithLink(t, owner.userId, ["prototype"])
  const slug = await t.run(async (ctx) => (await ctx.db.get(projectId))?.slug ?? "")

  return { t, slug, token }
}

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("registering a prototype", () => {
  it("shows the client the prototype registered last for her project", async () => {
    const { t, slug, token } = await fixture()

    expect(await t.query(api.prototypes.forClient, { token })).toBeNull()

    await t.mutation(internal.prototypes.registerPrototype, {
      slug,
      kind: "mockup",
      url: "/prototypes/demo.html",
    })
    await t.mutation(internal.prototypes.registerPrototype, {
      slug,
      kind: "devApp",
      url: "https://demo-dev.example.com",
    })

    expect(await t.query(api.prototypes.forClient, { token })).toEqual({
      kind: "devApp",
      url: "https://demo-dev.example.com",
    })
  })

  it("rejects an unknown slug and a URL that isn't a web link", async () => {
    const { t, slug } = await fixture()

    await expect(
      t.mutation(internal.prototypes.registerPrototype, {
        slug: "nobody",
        kind: "mockup",
        url: "/",
      }),
    ).rejects.toThrow("No project has this slug.")
    await expect(
      t.mutation(internal.prototypes.registerPrototype, {
        slug,
        kind: "mockup",
        url: "javascript:alert(1)",
      }),
    ).rejects.toThrow("starts with https://")
  })

  it("rejects a client link that doesn't open the prototype stage", async () => {
    const t = newBackend()
    const owner = await signedIn(t, "owner@example.com")
    const { token } = await projectWithLink(t, owner.userId, ["interview"])

    await expect(t.query(api.prototypes.forClient, { token })).rejects.toThrow(WRONG_STAGE)
  })
})
