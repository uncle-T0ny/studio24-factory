import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { SearchField, clearsOnKey } from "./SearchField"

function markup(value: string): string {
  return renderToStaticMarkup(
    createElement(SearchField, {
      value,
      placeholder: "Search projects",
      onChange: () => undefined,
    }),
  )
}

describe("clearsOnKey", () => {
  it("clears on Esc only when there is text", () => {
    expect(clearsOnKey("Escape", "round")).toBe(true)
    expect(clearsOnKey("Escape", "")).toBe(false)
    expect(clearsOnKey("Enter", "round")).toBe(false)
  })
})

describe("SearchField", () => {
  it("renders a search input with its placeholder and value", () => {
    const html = markup("spring")

    expect(html).toContain('type="search"')
    expect(html).toContain('placeholder="Search projects"')
    expect(html).toContain('value="spring"')
  })

  it("shows the clear button only when there is text", () => {
    expect(markup("")).not.toContain("Clear search")
    expect(markup("bar")).toContain('aria-label="Clear search"')
  })
})
