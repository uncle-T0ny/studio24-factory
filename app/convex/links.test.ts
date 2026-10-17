import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import { newBackend, OWNER_EMAILS, projectWithLink, signedIn } from "./test.setup"

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("client links", () => {
  it("creates a link that opens the chosen stages and stores only the token's hash", async () => {
    const t = newBackend()
    const { as } = await signedIn(t, "owner@example.com")
    const projectId = await as.mutation(api.projects.create, { clientName: "Bakery", title: "App" })
    const { token } = await as.mutation(api.links.create, { projectId, stages: ["interview"] })
    const [link] = await as.query(api.links.listForProject, { projectId })

    expect(link?.stages).toEqual(["interview"])
    expect(link?.tokenHash).not.toContain(token)
    expect(await t.query(api.links.open, { token })).toEqual({
      clientName: "Bakery",
      stage: "interview",
      stages: ["interview"],
    })
  })

  it("refuses a link with no stage and a link to another owner's project", async () => {
    const t = newBackend()
    const owner = await signedIn(t, "owner@example.com")
    const other = await signedIn(t, "other@example.com")
    const projectId = await owner.as.mutation(api.projects.create, { clientName: "A", title: "A" })

    await expect(owner.as.mutation(api.links.create, { projectId, stages: [] })).rejects.toThrow(
      "Pick at least one stage",
    )
    await expect(
      other.as.mutation(api.links.create, { projectId, stages: ["interview"] }),
    ).rejects.toThrow("Not allowed")
  })

  it("stops opening a link once the owner revokes it", async () => {
    const t = newBackend()
    const { as, userId } = await signedIn(t, "owner@example.com")
    const { linkId, token } = await projectWithLink(t, userId, ["interview"])

    await as.mutation(api.links.revoke, { linkId })

    expect(await t.query(api.links.open, { token })).toBeNull()
  })

  it("tells the landing page the project's current stage when the link doesn't open it", async () => {
    const t = newBackend()
    const { as, userId } = await signedIn(t, "owner@example.com")
    const { projectId, token } = await projectWithLink(t, userId, ["interview"])

    await as.mutation(api.projects.moveStage, { projectId, stage: "prd" })

    expect(await t.query(api.links.open, { token })).toMatchObject({
      stage: "prd",
      stages: ["interview"],
    })
  })

  it("opens the final app only to a signed-in client", async () => {
    const t = newBackend()
    const { as, userId } = await signedIn(t, "owner@example.com")
    const { token } = await projectWithLink(t, userId, ["final"])

    await expect(t.query(api.links.finalApp, { token })).rejects.toThrow("Sign in")
    expect(await as.query(api.links.finalApp, { token })).toEqual({
      title: "Wedding planner",
      appUrl: null,
    })
  })

  it("lets only the project's owner move its stage", async () => {
    const t = newBackend()
    const owner = await signedIn(t, "owner@example.com")
    const other = await signedIn(t, "other@example.com")
    const { projectId } = await projectWithLink(t, owner.userId, ["interview"])

    await expect(
      other.as.mutation(api.projects.moveStage, { projectId, stage: "prd" }),
    ).rejects.toThrow("Not allowed")
    await owner.as.mutation(api.projects.moveStage, { projectId, stage: "prd" })

    expect(await owner.as.query(api.projects.stageEvents, { projectId })).toHaveLength(2)
  })
})
