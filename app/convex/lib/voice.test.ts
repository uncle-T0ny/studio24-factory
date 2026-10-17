import { describe, expect, it } from "vitest"
import {
  bearerSecret,
  DEFAULT_SESSIONS_PER_DAY,
  isAgentRequest,
  secretsMatch,
  sessionsPerDay,
} from "./voice"

describe("the agent secret", () => {
  it("is read from a bearer header only", () => {
    expect(bearerSecret("Bearer abc")).toBe("abc")
    expect(bearerSecret("Bearer   abc  ")).toBe("abc")
    expect(bearerSecret("bearer abc")).toBeNull()
    expect(bearerSecret("Bearer")).toBeNull()
    expect(bearerSecret("Bearer a b")).toBeNull()
    expect(bearerSecret(null)).toBeNull()
  })

  it("matches only the same string, whatever the lengths", async () => {
    expect(await secretsMatch("s3cret", "s3cret")).toBe(true)
    expect(await secretsMatch("s3cret", "s3creT")).toBe(false)
    expect(await secretsMatch("s3cret", "s3cret-and-more")).toBe(false)
    expect(await secretsMatch("", "s3cret")).toBe(false)
  })

  it("lets nobody in when the deployment has none", async () => {
    expect(await isAgentRequest("Bearer x", undefined)).toBe(false)
    expect(await isAgentRequest("Bearer x", "  ")).toBe(false)
    expect(await isAgentRequest("Bearer x", "x")).toBe(true)
  })
})

describe("sessionsPerDay", () => {
  it("reads a whole number, with a default when unset", () => {
    expect(sessionsPerDay(undefined)).toBe(DEFAULT_SESSIONS_PER_DAY)
    expect(sessionsPerDay(" ")).toBe(DEFAULT_SESSIONS_PER_DAY)
    expect(sessionsPerDay("0")).toBe(0)
    expect(sessionsPerDay("15")).toBe(15)

    for (const raw of ["-1", "2.5", "ten"]) {
      expect(() => sessionsPerDay(raw)).toThrow("VOICE_SESSIONS_PER_DAY must be a whole number.")
    }
  })
})
