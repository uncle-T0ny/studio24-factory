import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api, internal } from "./_generated/api"
import { MAX_PROJECT_NAME_LENGTH } from "./lib/validators"
import { newBackend, OWNER_EMAILS, projectWithLink, signedIn } from "./test.setup"

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

describe("projects:setStage", () => {
  it("moves the project to the stage and marks the earlier stages done", async () => {
    const t = newBackend()
    const { userId } = await signedIn(t, "owner@example.com")
    const { projectId } = await projectWithLink(t, userId, ["interview"])

    await t.mutation(internal.projects.setStage, { slug: "demo-client", stage: "analysis" })

    const { project, events } = await t.run(async (ctx) => ({
      project: await ctx.db.get(projectId),
      events: await ctx.db.query("stageEvents").collect(),
    }))

    expect(project?.stage).toBe("analysis")
    expect(events.map((event) => [event.stage, event.status])).toEqual([
      ["interview", "done"],
      ["prd", "done"],
      ["analysis", "active"],
    ])
  })

  it("sets later stages back to pending when the project moves back", async () => {
    const t = newBackend()
    const { userId } = await signedIn(t, "owner@example.com")

    await projectWithLink(t, userId, ["interview"])
    await t.mutation(internal.projects.setStage, { slug: "demo-client", stage: "prototype" })
    await t.mutation(internal.projects.setStage, { slug: "demo-client", stage: "prd" })

    const events = await t.run(async (ctx) => await ctx.db.query("stageEvents").collect())

    const prototype = events.find((event) => event.stage === "prototype")

    expect(prototype?.status).toBe("pending")
    expect(prototype?.startedAt).toBeUndefined()
    expect(events.find((event) => event.stage === "prd")?.status).toBe("active")
  })

  it("refuses a slug no project has", async () => {
    const t = newBackend()

    await expect(
      t.mutation(internal.projects.setStage, { slug: "nobody", stage: "prd" }),
    ).rejects.toThrow("No project with slug nobody")
  })
})
