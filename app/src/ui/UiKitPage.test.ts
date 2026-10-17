import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import UiKitPage from "./UiKitPage"

describe("UiKitPage", () => {
  it("renders every section of the kit", () => {
    const markup = renderToStaticMarkup(
      createElement(MemoryRouter, {
        initialEntries: ["/ui-kit"],
        children: createElement(UiKitPage),
      }),
    )

    for (const id of ["tokens", "buttons", "inputs", "choices", "status", "overlays", "chrome"]) {
      expect(markup).toContain(`id="${id}"`)
    }

    expect(markup).toContain("--amber-soft")
    expect(markup).toContain("ui-callout--warning")
    expect(markup).toContain("System sans 600")
    expect(markup).toContain("ui-shortcut-list")
    expect(markup).toContain('type="search"')
    expect(markup).toContain("No projects match")
    expect(markup).toContain('aria-pressed="true"')
    expect(markup).toContain("ui-floating-toolbar--bottom-end")
    expect(markup).toContain('type="range"')

    for (const className of [
      "ui-dialog",
      "ui-image-input",
      "ui-thumbnail",
      "ui-meta-list",
      "ui-card-header",
      "ui-text--multiline",
    ]) {
      expect(markup).toContain(className)
    }
  })
})
