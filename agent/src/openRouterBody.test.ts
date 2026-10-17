import { describe, expect, it } from "vitest"
import { withThinkingOff } from "./openRouterBody.ts"

describe("withThinkingOff", () => {
  it("adds the reasoning switch to the request body", () => {
    expect(withThinkingOff(undefined)).toEqual({ extra_body: { reasoning: { enabled: false } } })
  })

  it("keeps the caller's other kwargs and body fields, and wins over their reasoning", () => {
    const extras = {
      user: "u1",
      extra_body: { cache_control: { type: "ephemeral" }, reasoning: { effort: "high" } },
    }

    expect(withThinkingOff(extras)).toEqual({
      user: "u1",
      extra_body: { cache_control: { type: "ephemeral" }, reasoning: { enabled: false } },
    })
  })
})
