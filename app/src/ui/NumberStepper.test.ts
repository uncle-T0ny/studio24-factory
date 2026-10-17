import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { Field } from "./Field"
import { parseNumberDraft } from "./NumberField"
import { NumberStepper, clampValue, stepValue } from "./NumberStepper"

function renderStepper(value: number, min: number, max: number): string {
  return renderToStaticMarkup(
    createElement(NumberStepper, {
      value,
      min,
      max,
      label: "Quantity",
      onChange: () => undefined,
    }),
  )
}

function countDisabled(markup: string): number {
  return markup.match(/disabled=""/g)?.length ?? 0
}

describe("clampValue", () => {
  it("keeps a value inside the range", () => {
    expect(clampValue(5, 0, 10)).toBe(5)
  })

  it("raises a value under min to min and lowers a value over max to max", () => {
    expect(clampValue(-3, 0, 10)).toBe(0)
    expect(clampValue(12, 0, 10)).toBe(10)
  })
})

describe("stepValue", () => {
  it("adds the step", () => {
    expect(stepValue(7, 1, 0, 12)).toBe(8)
    expect(stepValue(7, -1, 0, 12)).toBe(6)
  })

  it("stops at min and at max", () => {
    expect(stepValue(0, -1, 0, 12)).toBe(0)
    expect(stepValue(12, 1, 0, 12)).toBe(12)
    expect(stepValue(11, 5, 0, 12)).toBe(12)
  })
})

describe("NumberStepper", () => {
  it("disables minus at min and plus at max", () => {
    const atMin = renderStepper(0, 0, 10)
    const atMax = renderStepper(10, 0, 10)
    const between = renderStepper(5, 0, 10)

    expect(atMin).toMatch(/aria-label="Decrease" disabled=""/)
    expect(countDisabled(atMin)).toBe(1)
    expect(atMax).toMatch(/aria-label="Increase" disabled=""/)
    expect(countDisabled(atMax)).toBe(1)
    expect(countDisabled(between)).toBe(0)
  })

  it("shows the formatted value", () => {
    const markup = renderToStaticMarkup(
      createElement(NumberStepper, {
        value: 1,
        format: (value: number) => `+${value}`,
        onChange: () => undefined,
      }),
    )

    expect(markup).toContain(">+1</output>")
  })

  it("takes its accessible name from the surrounding Field", () => {
    const markup = renderToStaticMarkup(
      createElement(Field, {
        label: "Quantity",
        children: createElement(NumberStepper, {
          value: 7,
          onChange: () => undefined,
        }),
      }),
    )
    const labelId = markup.match(/<label id="([^"]+)"/)?.[1]

    expect(labelId).toBeDefined()
    expect(markup).toContain(`aria-labelledby="${labelId}"`)
  })
})

describe("parseNumberDraft", () => {
  it("reads a number and rejects an empty or invalid draft", () => {
    expect(parseNumberDraft(" 7.5 ")).toBe(7.5)
    expect(parseNumberDraft("")).toBeNull()
    expect(parseNumberDraft("abc")).toBeNull()
  })
})
