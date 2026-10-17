import { describe, expect, it } from "vitest"
import { zip } from "./arrays"

describe("zip", () => {
  it("pairs by position up to the shorter list", () => {
    expect(zip(["a", "b", "c"], [1, 2])).toEqual([
      ["a", 1],
      ["b", 2],
    ])
    expect(zip([], [1])).toEqual([])
  })

  it("keeps an undefined that is a real element", () => {
    expect(zip([1], [undefined])).toEqual([[1, undefined]])
  })
})
