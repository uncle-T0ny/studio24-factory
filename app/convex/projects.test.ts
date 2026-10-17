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
  it("creates a project at the interview stage with a unique slug from the client's name", async () => {
    const t = newBackend()
    const { as } = await signedIn(t, "owner@example.com")
    const first = await as.mutation(api.projects.create, {
      clientName: "  Spring Bakery ",
      title: "Orders app",
    })
    const second = await as.mutation(api.projects.create, {
      clientName: "Spring Bakery",
      title: "Loyalty app",
    })
    const projects = await as.query(api.projects.listMine, {})

    expect(projects.map((project) => project._id).sort()).toEqual([first, second].sort())
    expect(projects.map((project) => project.slug).sort()).toEqual([
      "spring-bakery",
      "spring-bakery-2",
    ])
    expect(projects.every((project) => project.stage === "interview" && !project.isDemo)).toBe(true)
  })

  it("refuses an empty name and a too long one", async () => {
    const t = newBackend()
    const { as } = await signedIn(t, "owner@example.com")

    await expect(
      as.mutation(api.projects.create, { clientName: "  ", title: "App" }),
    ).rejects.toThrow("A project needs a name.")
    await expect(
      as.mutation(api.projects.create, {
        clientName: "Client",
        title: "x".repeat(MAX_PROJECT_NAME_LENGTH + 1),
      }),
    ).rejects.toThrow("Keep the name under")
  })

  it("deletes the owner's project", async () => {
    const t = newBackend()
    const { as } = await signedIn(t, "owner@example.com")
    const projectId = await as.mutation(api.projects.create, { clientName: "Client", title: "App" })

    await as.mutation(api.projects.remove, { projectId })

    expect(await as.query(api.projects.listMine, {})).toEqual([])
    expect(await as.query(api.projects.get, { projectId })).toBeNull()
  })
})
