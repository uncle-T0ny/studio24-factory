import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import { backupEnvelopeOf, parseProjectBackup } from "./lib/backup"
import { newBackend, OWNER_EMAILS, signedIn } from "./test.setup"

const SPRING = { clientName: "Spring Bakery", title: "Spring launch" }

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("backup", () => {
  it("round-trips a project through the export file as a new project with its own slug", async () => {
    const t = newBackend()
    const { as } = await signedIn(t, "owner@example.com")
    const projectId = await as.mutation(api.projects.create, SPRING)
    const content = await as.query(api.backup.exportProject, { projectId })
    const text = JSON.stringify(backupEnvelopeOf(content, "2026-10-17T10:00:00.000Z"))
    const importedId = await as.mutation(api.backup.importProject, parseProjectBackup(text).data)
    const projects = await as.query(api.projects.listMine, {})
    const original = projects.find((project) => project._id === projectId)
    const imported = projects.find((project) => project._id === importedId)

    expect(content).toEqual({ project: SPRING })
    expect(imported).toMatchObject({ ...SPRING, stage: "interview" })
    expect(imported?.slug).not.toBe(original?.slug)
  })

  it("exports and imports for the project's owner only", async () => {
    const t = newBackend()
    const owner = await signedIn(t, "owner@example.com")
    const other = await signedIn(t, "other@example.com")
    const projectId = await owner.as.mutation(api.projects.create, SPRING)

    await expect(other.as.query(api.backup.exportProject, { projectId })).rejects.toThrow(
      "Not allowed",
    )
    await expect(t.query(api.backup.exportProject, { projectId })).rejects.toThrow("Not allowed")
    await expect(
      t.mutation(api.backup.importProject, { project: { clientName: "Sneaked", title: "In" } }),
    ).rejects.toThrow("Not allowed")
  })
})
