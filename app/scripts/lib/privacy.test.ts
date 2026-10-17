import { describe, expect, test } from "vitest"
import { findPrivateData, parseDenyList } from "./privacy"

describe("findPrivateData", () => {
  test("flags an email address on its line, even with no deny list", () => {
    expect(findPrivateData("Notes\nWrite to jane.roe@acme.io", [])).toEqual([
      { line: 2, kind: "an email address" },
    ])
  })

  test("flags a deny-listed name whatever its case", () => {
    expect(findPrivateData("we met JANE ROE today", ["Jane Roe"])).toEqual([
      { line: 1, kind: "a deny-listed name" },
    ])
  })

  test("does not flag a deny-listed name inside a longer word", () => {
    expect(findPrivateData("the annual plan", ["Ann"])).toEqual([])
  })

  test("treats a deny-listed name as text, not a pattern", () => {
    expect(findPrivateData("Acme Inc", ["Acme Inc."])).toEqual([])
    expect(findPrivateData("Acme Inc. signed", ["Acme Inc."])).toHaveLength(1)
  })

  test("passes a made-up demo transcript", () => {
    expect(findPrivateData("Demo client: we need a booking app.", ["Jane Roe"])).toEqual([])
  })
})

describe("parseDenyList", () => {
  test("keeps one name per line and skips blank lines and # comments", () => {
    expect(parseDenyList("# real clients\nJane Roe\n\n  Acme Inc.  \n")).toEqual([
      "Jane Roe",
      "Acme Inc.",
    ])
  })
})
