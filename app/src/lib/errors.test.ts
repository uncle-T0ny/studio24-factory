import { ConvexError } from "convex/values"
import { describe, expect, it, vi } from "vitest"
import { errorMessage, reportError, UserError } from "./errors"

const FALLBACK = "Something went wrong. Please try again."

describe("errorMessage", () => {
  it("shows a UserError's message and a ConvexError's string", () => {
    expect(errorMessage(new UserError("Choose a PNG, JPG or PDF file."))).toBe(
      "Choose a PNG, JPG or PDF file.",
    )
    expect(errorMessage(new ConvexError("Not allowed"))).toBe("Not allowed")
  })

  it("hides anything else behind one sentence", () => {
    expect(errorMessage(new Error("TypeError: x is undefined"))).toBe(FALLBACK)
    expect(errorMessage(new ConvexError({ code: 42 }))).toBe(FALLBACK)
    expect(errorMessage("a string")).toBe(FALLBACK)
  })
})

describe("reportError", () => {
  it("logs the error and returns its message", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const error = new UserError("The upload didn't return a file.")

    expect(reportError(error)).toBe("The upload didn't return a file.")
    expect(log).toHaveBeenCalledWith(error)
    log.mockRestore()
  })
})
