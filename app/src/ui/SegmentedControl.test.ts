import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { SegmentedControl, nextSegmentValue } from "./SegmentedControl"
import type { Option } from "./types"

enum Shape {
  Round = "round",
  Rect = "rect",
  Square = "square",
}

const SHAPES: Option<Shape>[] = [
  {
    value: Shape.Round,
    label: "Round",
  },
  {
    value: Shape.Rect,
    label: "Rectangular",
  },
  {
    value: Shape.Square,
    label: "Square",
  },
]

describe("nextSegmentValue", () => {
  it("moves to the next and previous option and wraps around", () => {
    expect(nextSegmentValue(SHAPES, Shape.Round, "ArrowRight")).toBe(Shape.Rect)
    expect(nextSegmentValue(SHAPES, Shape.Square, "ArrowRight")).toBe(Shape.Round)
    expect(nextSegmentValue(SHAPES, Shape.Rect, "ArrowLeft")).toBe(Shape.Round)
    expect(nextSegmentValue(SHAPES, Shape.Round, "ArrowLeft")).toBe(Shape.Square)
    expect(nextSegmentValue(SHAPES, Shape.Round, "ArrowDown")).toBe(Shape.Rect)
    expect(nextSegmentValue(SHAPES, Shape.Rect, "ArrowUp")).toBe(Shape.Round)
  })

  it("jumps to the first and last option", () => {
    expect(nextSegmentValue(SHAPES, Shape.Rect, "Home")).toBe(Shape.Round)
    expect(nextSegmentValue(SHAPES, Shape.Rect, "End")).toBe(Shape.Square)
  })

  it("ignores other keys and an empty option list", () => {
    expect(nextSegmentValue(SHAPES, Shape.Rect, "a")).toBeNull()
    expect(nextSegmentValue([], Shape.Rect, "ArrowRight")).toBeNull()
  })
})

describe("SegmentedControl", () => {
  it("checks only the selected option and makes only it focusable", () => {
    const markup = renderToStaticMarkup(
      createElement(SegmentedControl<Shape>, {
        label: "Shape",
        value: Shape.Rect,
        options: SHAPES,
        onChange: () => undefined,
      }),
    )
    const checked = markup.match(/aria-checked="true"/g) ?? []
    const focusable = markup.match(/tabindex="0"/g) ?? []

    expect(checked).toHaveLength(1)
    expect(focusable).toHaveLength(1)
    expect(markup).toMatch(/aria-checked="true" tabindex="0" class="ui-segment">Rectangular/)
  })
})
