import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import { MAX_PROJECT_NAME_LENGTH } from "./lib/validators"
import { newBackend, OWNER_EMAILS, signedIn } from "./test.setup"

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("projects", () => {
  it("creates a project with a trimmed name and a long random share token", async () => {
    const t = newBackend()
    const { as } = await signedIn(t, "owner@example.com")
    const first = await as.mutation(api.projects.create, { name: "  Spring launch " })
    const second = await as.mutation(api.projects.create, { name: "Autumn review" })
    const projects = await as.query(api.projects.listMine, {})

    expect(projects.map((project) => project.name)).toEqual(["Autumn review", "Spring launch"])
    expect(projects.map((project) => project._id)).toEqual([second, first])
    expect(new Set(projects.map((project) => project.shareToken)).size).toBe(2)

    for (const project of projects) {
      expect(project.shareToken).toMatch(/^[A-Za-z0-9_-]{32}$/)
    }
  })

  it("refuses an empty name and a too long one", async () => {
    const t = newBackend()
    const { as } = await signedIn(t, "owner@example.com")
    const projectId = await as.mutation(api.projects.create, { name: "Spring launch" })

    await expect(as.mutation(api.projects.create, { name: "  " })).rejects.toThrow(
      "A project needs a name.",
    )
    await expect(
      as.mutation(api.projects.rename, {
        projectId,
        name: "x".repeat(MAX_PROJECT_NAME_LENGTH + 1),
      }),
    ).rejects.toThrow("Keep the name under")
  })

  it("deletes the owner's project", async () => {
    const t = newBackend()
    const { as } = await signedIn(t, "owner@example.com")
    const projectId = await as.mutation(api.projects.create, { name: "Spring launch" })

    await as.mutation(api.projects.remove, { projectId })

    expect(await as.query(api.projects.listMine, {})).toEqual([])
    expect(await as.query(api.projects.get, { projectId })).toBeNull()
  })
})
