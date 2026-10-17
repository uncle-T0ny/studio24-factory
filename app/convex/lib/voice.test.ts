import { describe, expect, it } from "vitest"
import { bearerSecret, isAgentRequest, secretsMatch } from "./voice"

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
