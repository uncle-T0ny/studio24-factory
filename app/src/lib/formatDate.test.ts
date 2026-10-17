import { describe, expect, it } from "vitest"
import { formatIsoDate, formatTimestamp } from "./formatDate"

describe("formatIsoDate", () => {
  it("formats an ISO date the same in every time zone", () => {
    expect(formatIsoDate("2027-06-12")).toBe("Jun 12, 2027")
  })

  it("leaves text that isn't a date as it is", () => {
    expect(formatIsoDate("someday")).toBe("someday")
  })
})

describe("formatTimestamp", () => {
  it("formats a timestamp in the given time zone", () => {
    expect(formatTimestamp(Date.UTC(2026, 9, 16, 21, 4), "UTC")).toBe("Oct 16, 2026, 9:04 PM")
  })
})
