import { afterEach, describe, expect, it, vi } from "vitest"
import { internal } from "./_generated/api"
import { FeedbackStatus, FeedbackType } from "./lib/feedback"
import { OWNER_SCOPED_TABLES } from "./lib/ownerData"
import { testOwnerEmail } from "./lib/owners"
import schema from "./schema"
import { newBackend, storedFile } from "./test.setup"

const SUFFIX = "unit"

afterEach(() => {
  vi.unstubAllEnvs()
})

function fieldsOf(table: string): readonly string[] {
  const definition = Object.entries(schema.tables).find(([name]) => name === table)?.[1]
  const validator = definition?.validator

  return validator?.kind === "object" ? Object.keys(validator.fields) : []
}

describe("the owner-scoped table list", () => {
  it("names every table with an ownerId field, so deleting an owner misses none", () => {
    const withOwner = Object.keys(schema.tables).filter((table) =>
      fieldsOf(table).includes("ownerId"),
    )

    expect(OWNER_SCOPED_TABLES.map((entry) => entry.table).sort()).toEqual(withOwner.sort())
  })
})

describe("testing functions", () => {
  it("refuse to run unless ALLOW_TEST_FUNCTIONS=true", async () => {
    const t = newBackend()

    for (const flag of [undefined, "false", "1"]) {
      vi.stubEnv("ALLOW_TEST_FUNCTIONS", flag)
      await expect(
        t.mutation(internal.testing.deleteTestOwner, { ownerSuffix: SUFFIX }),
      ).rejects.toThrow("Test functions are off")
    }
  })

  it("delete a test owner with her projects, feedback, screenshots and auth rows", async () => {
    vi.stubEnv("ALLOW_TEST_FUNCTIONS", "true")

    const t = newBackend()
    const { ownerId } = await t.mutation(internal.testing.createTestProject, {
      ownerSuffix: SUFFIX,
      name: "Spring launch",
    })
    const screenshotId = await storedFile(t, "image/png", 10)

    await t.run(async (ctx) => {
      await ctx.db.insert("feedback", {
        ownerId,
        type: FeedbackType.Broken,
        message: "The export button does nothing",
        screenshotId,
        context: {
          path: "/",
          appVersion: "test",
          userAgent: "test",
          viewport: { width: 1, height: 1 },
          time: "2026-10-17T10:00:00.000Z",
          timeZone: "UTC",
        },
        createdAt: 0,
        status: FeedbackStatus.New,
      })
      await ctx.db.insert("authAccounts", {
        userId: ownerId,
        provider: "password",
        providerAccountId: testOwnerEmail(SUFFIX),
      })
    })

    const result = await t.mutation(internal.testing.deleteTestOwner, { ownerSuffix: SUFFIX })
    const left = await t.run(async (ctx) => ({
      users: await ctx.db.query("users").collect(),
      projects: await ctx.db.query("projects").collect(),
      feedback: await ctx.db.query("feedback").collect(),
      accounts: await ctx.db.query("authAccounts").collect(),
      screenshot: await ctx.db.system.get(screenshotId),
    }))

    expect(result).toEqual({ deletedUsers: 1 })
    expect(left).toEqual({ users: [], projects: [], feedback: [], accounts: [], screenshot: null })
  })
})
