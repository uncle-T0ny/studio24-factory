import { validate } from "convex-helpers/validators"
import { describe, expect, it } from "vitest"
import {
  browserSummary,
  cleanFeedbackContext,
  cleanFeedbackMessage,
  feedbackContextValidator,
  feedbackEntryValidator,
  FeedbackStatus,
  feedbackStatusValidator,
  FeedbackType,
  feedbackTypeValidator,
  formatSenderTime,
  isScreenshotType,
  MAX_MESSAGE_LENGTH,
  type FeedbackContext,
} from "./feedback"

const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
const MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"
const WINDOWS_EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0"
const LINUX_FIREFOX = "Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0"
const HEADLESS =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.37 Safari/537.36"

const CONTEXT: FeedbackContext = {
  path: "/project/k17abc",
  projectId: "k17abc",
  appVersion: "a680093",
  userAgent: MAC_CHROME,
  viewport: {
    width: 1440,
    height: 900,
  },
  time: "2026-10-16T21:04:05.000Z",
  timeZone: "America/Denver",
}

describe("feedback validators", () => {
  it("accept the three types and the two statuses, and nothing else", () => {
    for (const type of Object.values(FeedbackType)) {
      expect(validate(feedbackTypeValidator, type)).toBe(true)
    }

    for (const status of Object.values(FeedbackStatus)) {
      expect(validate(feedbackStatusValidator, status)).toBe(true)
    }

    expect(validate(feedbackTypeValidator, "bug")).toBe(false)
    expect(validate(feedbackStatusValidator, "open")).toBe(false)
  })

  it("accept a context from a project's page and one from the projects page", () => {
    const { projectId: _projectId, ...projectsPage } = CONTEXT

    expect(validate(feedbackContextValidator, CONTEXT)).toBe(true)
    expect(validate(feedbackContextValidator, { ...projectsPage, path: "/" })).toBe(true)
  })

  it("refuse a context with a field missing, of the wrong type or unknown", () => {
    const { userAgent: _userAgent, ...noUserAgent } = CONTEXT

    expect(validate(feedbackContextValidator, noUserAgent)).toBe(false)
    expect(validate(feedbackContextValidator, { ...CONTEXT, viewport: { width: 1440 } })).toBe(
      false,
    )
    expect(validate(feedbackContextValidator, { ...CONTEXT, viewport: "1440x900" })).toBe(false)
    expect(validate(feedbackContextValidator, { ...CONTEXT, cookie: "secret" })).toBe(false)
  })

  it("describe an entry as the page and the triage script get it", () => {
    const entry = {
      id: "feedback:1",
      type: FeedbackType.Feature,
      message: "Add a dark mode",
      status: FeedbackStatus.New,
      createdAt: 1_760_648_645_000,
      context: CONTEXT,
      authorEmail: "other@example.com",
      screenshotUrl: null,
    }

    expect(validate(feedbackEntryValidator, entry)).toBe(true)
    expect(validate(feedbackEntryValidator, { ...entry, status: "closed" })).toBe(false)
  })
})

describe("cleanFeedbackMessage", () => {
  it("trims the message", () => {
    expect(cleanFeedbackMessage("  The export button does nothing\n")).toBe(
      "The export button does nothing",
    )
  })

  it("refuses an empty message and a too long one", () => {
    expect(() => cleanFeedbackMessage(" \n\t ")).toThrow()
    expect(() => cleanFeedbackMessage("x".repeat(MAX_MESSAGE_LENGTH + 1))).toThrow()
    expect(cleanFeedbackMessage("x".repeat(MAX_MESSAGE_LENGTH))).toHaveLength(MAX_MESSAGE_LENGTH)
  })
})

describe("cleanFeedbackContext", () => {
  it("keeps a sane context as it is", () => {
    expect(cleanFeedbackContext(CONTEXT)).toEqual(CONTEXT)
  })

  it("clips long strings, rounds the viewport and drops empty ids", () => {
    const cleaned = cleanFeedbackContext({
      ...CONTEXT,
      path: `/${"p".repeat(5000)}`,
      userAgent: "u".repeat(5000),
      viewport: {
        width: 1439.6,
        height: Number.NaN,
      },
      projectId: "  ",
    })

    expect(cleaned.path).toHaveLength(2000)
    expect(cleaned.userAgent).toHaveLength(1000)
    expect(cleaned.viewport).toEqual({
      width: 1440,
      height: 0,
    })
    expect(cleaned).not.toHaveProperty("projectId")
    expect(validate(feedbackContextValidator, cleaned)).toBe(true)
  })
})

describe("isScreenshotType", () => {
  it("accepts PNG and JPEG only", () => {
    expect(isScreenshotType("image/png")).toBe(true)
    expect(isScreenshotType("image/jpeg")).toBe(true)
    expect(isScreenshotType("image/gif")).toBe(false)
    expect(isScreenshotType("image/svg+xml")).toBe(false)
    expect(isScreenshotType(undefined)).toBe(false)
  })
})

describe("browserSummary", () => {
  it("names the browser, its major version and the system", () => {
    expect(browserSummary(MAC_CHROME)).toBe("Chrome 141 on macOS")
    expect(browserSummary(MAC_SAFARI)).toBe("Safari 18.6 on macOS")
    expect(browserSummary(WINDOWS_EDGE)).toBe("Edge 141 on Windows")
    expect(browserSummary(LINUX_FIREFOX)).toBe("Firefox 143 on Linux")
    expect(browserSummary(HEADLESS)).toBe("Headless Chrome 141 on macOS")
    expect(browserSummary("curl/8.7.1")).toBe("Unknown browser")
  })
})

describe("formatSenderTime", () => {
  it("shows the sender's own clock and time zone", () => {
    expect(formatSenderTime(CONTEXT)).toBe("Oct 16, 2026, 3:04 PM (America/Denver)")
  })

  it("falls back to UTC for an unknown zone and to the raw text for an unreadable time", () => {
    expect(formatSenderTime({ ...CONTEXT, timeZone: "Mars/Olympus" })).toBe(
      "Oct 16, 2026, 9:04 PM (UTC)",
    )
    expect(formatSenderTime({ ...CONTEXT, time: "yesterday" })).toBe("yesterday")
  })
})
