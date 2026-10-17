import { describe, expect, it } from "vitest"
import {
  canKeepOriginal,
  encodingSteps,
  fitWithin,
  formatBytes,
  pastedImage,
  screenshotTypeOf,
} from "./screenshot"
import { MAX_SCREENSHOT_BYTES, MAX_SCREENSHOT_SIDE_PX } from "../../convex/lib/feedback"
import { defined } from "../test/defined"

const SCREENSHOT = {
  type: "image/png",
  name: "image.png",
}
const NOTES_TEXT_PICTURE = {
  type: "image/png",
  name: "text.png",
}

describe("fitWithin", () => {
  it("keeps a small image as it is", () => {
    expect(fitWithin({ width: 1200, height: 800 }, 2400)).toEqual({ width: 1200, height: 800 })
  })

  it("shrinks the longest side to the limit and keeps the shape", () => {
    expect(fitWithin({ width: 3456, height: 2234 }, 2400)).toEqual({ width: 2400, height: 1551 })
    expect(fitWithin({ width: 1000, height: 4000 }, 2400)).toEqual({ width: 600, height: 2400 })
  })
})

describe("screenshotTypeOf", () => {
  it("takes PNG and JPEG by type, or by name when the type is missing", () => {
    expect(screenshotTypeOf(SCREENSHOT)).toBe("image/png")
    expect(screenshotTypeOf({ type: "image/jpeg", name: "photo" })).toBe("image/jpeg")
    expect(screenshotTypeOf({ type: "", name: "Screenshot 2026-10-16.PNG" })).toBe("image/png")
    expect(screenshotTypeOf({ type: "", name: "photo.jpeg" })).toBe("image/jpeg")
  })

  it("refuses other images and files", () => {
    expect(screenshotTypeOf({ type: "image/gif", name: "cat.gif" })).toBeNull()
    expect(screenshotTypeOf({ type: "application/pdf", name: "notes.pdf" })).toBeNull()
  })
})

describe("pastedImage", () => {
  it("takes a macOS screenshot from the clipboard, in the message or anywhere else", () => {
    expect(pastedImage({ files: [SCREENSHOT], hasText: false, isTextTarget: true })).toBe(
      SCREENSHOT,
    )
    expect(pastedImage({ files: [SCREENSHOT], hasText: false, isTextTarget: false })).toBe(
      SCREENSHOT,
    )
  })

  it("leaves pasted text in a text field as text, even with a picture of it", () => {
    expect(
      pastedImage({ files: [NOTES_TEXT_PICTURE], hasText: true, isTextTarget: true }),
    ).toBeNull()
    expect(pastedImage({ files: [NOTES_TEXT_PICTURE], hasText: true, isTextTarget: false })).toBe(
      NOTES_TEXT_PICTURE,
    )
  })

  it("ignores a paste with no image", () => {
    expect(pastedImage({ files: [], hasText: true, isTextTarget: true })).toBeNull()
    expect(
      pastedImage({
        files: [{ type: "application/pdf", name: "notes.pdf" }],
        hasText: false,
        isTextTarget: false,
      }),
    ).toBeNull()
  })
})

describe("canKeepOriginal and encodingSteps", () => {
  it("stores a screenshot that fits the limits as it is", () => {
    expect(canKeepOriginal({ width: 1440, height: 900 }, 400_000)).toBe(true)
    expect(canKeepOriginal({ width: 3456, height: 2234 }, 400_000)).toBe(false)
    expect(canKeepOriginal({ width: 1440, height: 900 }, MAX_SCREENSHOT_BYTES + 1)).toBe(false)
  })

  it("re-encodes a big one as PNG, then JPEG, then a smaller JPEG", () => {
    const steps = encodingSteps({ width: 3456, height: 2234 })

    expect(steps.map((step) => step.type)).toEqual(["image/png", "image/jpeg", "image/jpeg"])
    expect(Math.max(defined(steps[0]).size.width, defined(steps[0]).size.height)).toBe(
      MAX_SCREENSHOT_SIDE_PX,
    )
    expect(defined(steps[2]).size.width).toBeLessThan(defined(steps[1]).size.width)
  })
})

describe("formatBytes", () => {
  it("shows KB under a megabyte and MB above", () => {
    expect(formatBytes(300)).toBe("1 KB")
    expect(formatBytes(45_357)).toBe("44 KB")
    expect(formatBytes(2_500_000)).toBe("2.4 MB")
  })
})
