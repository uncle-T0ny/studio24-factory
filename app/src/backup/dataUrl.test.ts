import { describe, expect, it } from "vitest"
import { bytesToDataUrl, dataUrlToBytes } from "./dataUrl"

describe("data URLs", () => {
  it("round-trips bytes larger than one chunk", () => {
    const bytes = new Uint8Array(100_000).map((_, index) => (index * 31) % 256)
    const dataUrl = bytesToDataUrl("image/png", bytes)
    const decoded = dataUrlToBytes(dataUrl)

    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true)
    expect(decoded.contentType).toBe("image/png")
    expect(decoded.bytes).toEqual(bytes)
  })

  it("rejects text that isn't a base64 data URL", () => {
    expect(() => dataUrlToBytes("https://example.com/image.png")).toThrow("can't be read")
    expect(() => dataUrlToBytes("data:image/png,raw")).toThrow("can't be read")
  })
})
