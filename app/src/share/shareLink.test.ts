import { describe, expect, it } from "vitest"
import { shareLinkOf } from "./shareLink"

describe("shareLinkOf", () => {
  it("puts the token under /p/ on the app's origin", () => {
    expect(shareLinkOf("https://app.example.com", "abc_DEF-123")).toBe(
      "https://app.example.com/p/abc_DEF-123",
    )
  })

  it("drops a trailing slash of the origin", () => {
    expect(shareLinkOf("http://localhost:5173/", "token")).toBe("http://localhost:5173/p/token")
  })

  it("escapes characters a URL path can't hold", () => {
    expect(shareLinkOf("http://localhost:5173", "a/b c")).toBe("http://localhost:5173/p/a%2Fb%20c")
  })
})
