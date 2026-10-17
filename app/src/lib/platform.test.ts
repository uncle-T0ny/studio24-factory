import { describe, expect, it } from "vitest"
import { Platform, platformOf } from "./platform"

describe("platformOf", () => {
  it("knows a Mac", () => {
    expect(platformOf("macOS")).toBe(Platform.Mac)
    expect(platformOf("MacIntel")).toBe(Platform.Mac)
    expect(platformOf("Windows")).toBe(Platform.Other)
  })

  it("reads the user agent where userAgentData is missing (Safari, Firefox)", () => {
    const safari =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) " +
      "Version/18.0 Safari/605.1.15"
    const iphone =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)"
    const firefoxOnWindows =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0"
    const firefoxOnLinux = "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0"

    expect(platformOf(safari)).toBe(Platform.Mac)
    expect(platformOf(iphone)).toBe(Platform.Mac)
    expect(platformOf(firefoxOnWindows)).toBe(Platform.Other)
    expect(platformOf(firefoxOnLinux)).toBe(Platform.Other)
  })
})
