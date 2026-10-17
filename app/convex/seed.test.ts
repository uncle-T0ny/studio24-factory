import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { internal } from "./_generated/api"
import { newBackend } from "./test.setup"

// The local seed (convex/seed.ts) that `npm start` runs on every start.

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
    expect(second).toEqual({ ...first, created: false })
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
