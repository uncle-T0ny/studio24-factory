import { describe, expect, it } from "vitest"
import { checkNumberDraft, DraftStatus } from "./NumberField"

describe("checkNumberDraft", () => {
  it("accepts a number in range", () => {
    expect(checkNumberDraft("7", 1, 40)).toEqual({
      status: DraftStatus.Valid,
      value: 7,
      message: null,
    })
  })

  it("refuses an empty or unparsable draft", () => {
    expect(checkNumberDraft("", 1, 40).status).toBe(DraftStatus.NotANumber)
    expect(checkNumberDraft("-", 1, 40).message).toBe("Enter a number")
  })

  it("refuses a number out of range and says the range", () => {
    expect(checkNumberDraft("41", 1, 40)).toEqual({
      status: DraftStatus.OutOfRange,
      value: 41,
      message: "Enter 1 to 40",
    })
    expect(checkNumberDraft("0", 1).message).toBe("Enter 1 or more")
    expect(checkNumberDraft("500", undefined, 200).message).toBe("Enter 200 or less")
  })
})
