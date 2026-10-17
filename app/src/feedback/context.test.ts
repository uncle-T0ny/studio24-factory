import { validate } from "convex-helpers/validators"
import { describe, expect, it } from "vitest"
import { captureContext, contextSummary, type ContextInput } from "./context"
import { feedbackContextValidator } from "../../convex/lib/feedback"

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"

const PROJECT_PAGE: ContextInput = {
  pathname: "/project/k17abc",
  search: "",
  userAgent: USER_AGENT,
  viewport: {
    width: 1440,
    height: 899.5,
  },
  now: new Date("2026-10-16T21:04:05.000Z"),
  timeZone: "America/Denver",
  appVersion: "a680093",
  target: {
    projectId: "k17abc",
  },
}

describe("captureContext", () => {
  it("captures the path, the project, the version, the browser, the window and the time", () => {
    const context = captureContext(PROJECT_PAGE)

    expect(context).toEqual({
      path: "/project/k17abc",
      projectId: "k17abc",
      appVersion: "a680093",
      userAgent: USER_AGENT,
      viewport: {
        width: 1440,
        height: 900,
      },
      time: "2026-10-16T21:04:05.000Z",
      timeZone: "America/Denver",
    })
    expect(validate(feedbackContextValidator, context)).toBe(true)
  })

  it("has no project on the projects page", () => {
    const context = captureContext({
      ...PROJECT_PAGE,
      pathname: "/",
      search: "",
      target: undefined,
    })

    expect(context.path).toBe("/")
    expect(context).not.toHaveProperty("projectId")
    expect(validate(feedbackContextValidator, context)).toBe(true)
  })

  it("keeps the page's query", () => {
    const context = captureContext({
      ...PROJECT_PAGE,
      search: "?tab=settings&debug=1",
    })

    expect(context.path).toBe("/project/k17abc?tab=settings&debug=1")
  })
})

describe("contextSummary", () => {
  it("is the small print under the form: page, browser, window, version", () => {
    expect(contextSummary(captureContext(PROJECT_PAGE))).toBe(
      "Sent with: /project/k17abc · Chrome 141 on macOS · 1440 × 900 · version a680093",
    )
  })
})
