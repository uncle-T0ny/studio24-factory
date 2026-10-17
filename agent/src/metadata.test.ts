import { describe, expect, it } from "vitest"
import { parseJobMetadata } from "./metadata.ts"

describe("parseJobMetadata", () => {
  it("reads the session id the app dispatches with", () => {
    expect(parseJobMetadata(JSON.stringify({ sessionId: "abc123" }))).toEqual({
      sessionId: "abc123",
    })
  })

  it("reads anything else as no metadata", () => {
    for (const raw of [undefined, "", "not json", "[]", "null", '{"sessionId":7}', '{"x":1}']) {
      expect(parseJobMetadata(raw)).toEqual({ sessionId: null })
    }
  })
})
