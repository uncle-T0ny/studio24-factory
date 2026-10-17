import { describe, expect, it } from "vitest"
import { requireTestFunctions } from "../testing"
import { isOwnerEmail, isTestOwnerEmail, testOwnerEmail, type OwnerEnv } from "./owners"

const LISTED = "owner-b@example.com,test-owner@example.com,owner-a@example.com"

function envOf(allowTestFunctions: string | undefined): OwnerEnv {
  return {
    ownerEmails: LISTED,
    allowTestFunctions,
  }
}

describe("testOwnerEmail", () => {
  it("gives each caller its own address", () => {
    expect(testOwnerEmail("integrator")).toBe("test-owner+integrator@example.com")
    expect(testOwnerEmail("prove-owner-1a2b")).toBe("test-owner+prove-owner-1a2b@example.com")
  })

  it("refuses a suffix that could reach another address", () => {
    expect(() => testOwnerEmail("")).toThrow()
    expect(() => testOwnerEmail("a@b.com")).toThrow()
    expect(() => testOwnerEmail("Upper")).toThrow()
  })

  it("recognizes only suffixed test owners", () => {
    expect(isTestOwnerEmail("test-owner+qa@example.com")).toBe(true)
    expect(isTestOwnerEmail(" Test-Owner+QA@Example.com ")).toBe(true)
    expect(isTestOwnerEmail("test-owner@example.com")).toBe(false)
    expect(isTestOwnerEmail("test-owner+qa@example.com.evil")).toBe(false)
    expect(isTestOwnerEmail("owner-a@example.com")).toBe(false)
  })
})

describe("isOwnerEmail", () => {
  it("lets every listed email sign up, whatever the test flag", () => {
    for (const flag of [undefined, "true"]) {
      expect(isOwnerEmail("owner-a@example.com", envOf(flag))).toBe(true)
      expect(isOwnerEmail("Owner-B@Example.com", envOf(flag))).toBe(true)
      expect(isOwnerEmail("test-owner@example.com", envOf(flag))).toBe(true)
    }
  })

  it("lets suffixed test owners sign up only where test functions are on", () => {
    expect(isOwnerEmail("test-owner+qa@example.com", envOf("true"))).toBe(true)
    expect(isOwnerEmail("test-owner+qa@example.com", envOf(undefined))).toBe(false)
    expect(isOwnerEmail("test-owner+qa@example.com", envOf("false"))).toBe(false)
  })

  it("refuses strangers", () => {
    expect(isOwnerEmail("stranger@example.com", envOf("true"))).toBe(false)
  })
})

describe("requireTestFunctions", () => {
  it("throws unless ALLOW_TEST_FUNCTIONS is exactly true", () => {
    expect(() => requireTestFunctions("true")).not.toThrow()
    expect(() => requireTestFunctions(undefined)).toThrow("Test functions are off")
    expect(() => requireTestFunctions("1")).toThrow("Test functions are off")
  })
})
