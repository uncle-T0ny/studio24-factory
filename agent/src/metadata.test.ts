import { describe, expect, it } from "vitest"
import { parseJobMetadata } from "./metadata.ts"

describe("parseJobMetadata", () => {
  it("reads the interview id the app dispatches with", () => {
    expect(parseJobMetadata(JSON.stringify({ interviewId: "abc123" }))).toEqual({
      interviewId: "abc123",
    })
  })

  it("reads anything else as no metadata", () => {
    for (const raw of [undefined, "", "not json", "[]", "null", '{"interviewId":7}', '{"x":1}']) {
      expect(parseJobMetadata(raw)).toEqual({ interviewId: null })
    }
  })
})
