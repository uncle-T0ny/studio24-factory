import { ConvexError, v, type Infer } from "convex/values"

// In-app feedback: the validators, limits and pure helpers shared by convex/feedback.ts,
// the dialog and the /feedback page in src/feedback/, and scripts/feedback.ts.

export enum FeedbackType {
  Broken = "broken",
  Feature = "feature",
  Question = "question",
}

export enum FeedbackStatus {
  New = "new",
  Done = "done",
}

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  [FeedbackType.Broken]: "Something's broken",
  [FeedbackType.Feature]: "Feature request",
  [FeedbackType.Question]: "Question",
}

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  [FeedbackStatus.New]: "New",
  [FeedbackStatus.Done]: "Done",
}

export const MAX_MESSAGE_LENGTH = 5000
// A screenshot is stored as PNG or JPEG, at most this many bytes, its longest side at most
// MAX_SCREENSHOT_SIDE_PX; the browser shrinks a bigger one before it uploads (src/feedback).
export const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024
export const MAX_SCREENSHOT_SIDE_PX = 2400
export const SCREENSHOT_TYPES: readonly string[] = ["image/png", "image/jpeg"]

const MAX_PATH_LENGTH = 2000
const MAX_USER_AGENT_LENGTH = 1000
const MAX_SHORT_TEXT_LENGTH = 100
const MAX_VIEWPORT_PX = 100_000

export const feedbackTypeValidator = v.union(
  v.literal(FeedbackType.Broken),
  v.literal(FeedbackType.Feature),
  v.literal(FeedbackType.Question),
)

export const feedbackStatusValidator = v.union(
  v.literal(FeedbackStatus.New),
  v.literal(FeedbackStatus.Done),
)

export const viewportValidator = v.object({
  width: v.number(),
  height: v.number(),
})

// Captured in the browser when the feedback is sent (src/feedback/context.ts).
export const feedbackContextValidator = v.object({
  // pathname + search, e.g. /project/<id>?tab=settings
  path: v.string(),
  // The project the page shows, when sent from a project's page.
  projectId: v.optional(v.string()),
  // The git short commit the frontend was built from.
  appVersion: v.string(),
  userAgent: v.string(),
  viewport: viewportValidator,
  // The browser's clock as ISO 8601 UTC, and its IANA time zone.
  time: v.string(),
  timeZone: v.string(),
})

export const feedbackFields = {
  ownerId: v.id("users"),
  type: feedbackTypeValidator,
  message: v.string(),
  screenshotId: v.optional(v.id("_storage")),
  context: feedbackContextValidator,
  createdAt: v.number(),
  status: feedbackStatusValidator,
}

// One entry as the /feedback page and the triage script get it.
export const feedbackEntryValidator = v.object({
  id: v.id("feedback"),
  type: feedbackTypeValidator,
  message: v.string(),
  status: feedbackStatusValidator,
  createdAt: v.number(),
  context: feedbackContextValidator,
  authorEmail: v.union(v.string(), v.null()),
  screenshotUrl: v.union(v.string(), v.null()),
})

export const feedbackEntriesValidator = v.array(feedbackEntryValidator)

export type FeedbackContext = Infer<typeof feedbackContextValidator>
export type FeedbackEntry = Infer<typeof feedbackEntryValidator>
export type Viewport = Infer<typeof viewportValidator>

export const FEEDBACK_TYPES: readonly FeedbackType[] = Object.values(FeedbackType)
export const FEEDBACK_STATUSES: readonly FeedbackStatus[] = Object.values(FeedbackStatus)

export function cleanFeedbackMessage(message: string): string {
  const cleaned = message.trim()

  if (cleaned.length === 0) {
    throw new ConvexError("Write a message first.")
  }

  if (cleaned.length > MAX_MESSAGE_LENGTH) {
    throw new ConvexError(`Keep the message under ${MAX_MESSAGE_LENGTH} characters.`)
  }

  return cleaned
}

function clip(text: string, maxLength: number): string {
  const trimmed = text.trim()

  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed
}

function clipOptional(text: string | undefined): string | undefined {
  const clipped = text === undefined ? "" : clip(text, MAX_SHORT_TEXT_LENGTH)

  return clipped.length > 0 ? clipped : undefined
}

function cleanPixels(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }

  return Math.min(Math.round(value), MAX_VIEWPORT_PX)
}

// The context is the browser's word: long strings are clipped, odd numbers zeroed, never refused.
export function cleanFeedbackContext(context: FeedbackContext): FeedbackContext {
  const cleaned: FeedbackContext = {
    path: clip(context.path, MAX_PATH_LENGTH),
    appVersion: clip(context.appVersion, MAX_SHORT_TEXT_LENGTH),
    userAgent: clip(context.userAgent, MAX_USER_AGENT_LENGTH),
    viewport: {
      width: cleanPixels(context.viewport.width),
      height: cleanPixels(context.viewport.height),
    },
    time: clip(context.time, MAX_SHORT_TEXT_LENGTH),
    timeZone: clip(context.timeZone, MAX_SHORT_TEXT_LENGTH),
  }
  const projectId = clipOptional(context.projectId)

  if (projectId !== undefined) {
    cleaned.projectId = projectId
  }

  return cleaned
}

export function isScreenshotType(contentType: string | undefined): boolean {
  return contentType !== undefined && SCREENSHOT_TYPES.includes(contentType)
}

interface BrowserPattern {
  name: string
  pattern: RegExp
}

// Order matters: Edge and Opera also say "Chrome", and Chrome also says "Safari".
const BROWSER_PATTERNS: readonly BrowserPattern[] = [
  { name: "Headless Chrome", pattern: /\bHeadlessChrome\/(\d+)/ },
  { name: "Edge", pattern: /\bEdg(?:e|A|iOS)?\/(\d+)/ },
  { name: "Opera", pattern: /\bOPR\/(\d+)/ },
  { name: "Firefox", pattern: /\b(?:Firefox|FxiOS)\/(\d+)/ },
  { name: "Chrome", pattern: /\b(?:Chrome|CriOS)\/(\d+)/ },
  { name: "Safari", pattern: /\bVersion\/(\d+(?:\.\d+)?).*\bSafari\// },
]

const OS_PATTERNS: readonly BrowserPattern[] = [
  { name: "iOS", pattern: /\b(?:iPhone|iPad|iPod)\b/ },
  { name: "macOS", pattern: /\bMac OS X\b/ },
  { name: "Windows", pattern: /\bWindows\b/ },
  { name: "Android", pattern: /\bAndroid\b/ },
  { name: "ChromeOS", pattern: /\bCrOS\b/ },
  { name: "Linux", pattern: /\bLinux\b/ },
]

function browserName(userAgent: string): string {
  for (const candidate of BROWSER_PATTERNS) {
    const match = candidate.pattern.exec(userAgent)

    if (match) {
      return `${candidate.name} ${match[1]}`
    }
  }

  return "Unknown browser"
}

// "Chrome 141 on macOS" from a user agent; "Unknown browser" when nothing matches.
export function browserSummary(userAgent: string): string {
  const os = OS_PATTERNS.find((candidate) => candidate.pattern.test(userAgent))?.name
  const browser = browserName(userAgent)

  return os ? `${browser} on ${os}` : browser
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
}

// "Oct 16, 2026, 3:04 PM (America/Denver)": the sender's own clock and time zone.
export function formatSenderTime(context: Pick<FeedbackContext, "time" | "timeZone">): string {
  const date = new Date(context.time)

  if (Number.isNaN(date.getTime())) {
    return context.time
  }

  try {
    const local = date.toLocaleString("en-US", { ...TIME_FORMAT, timeZone: context.timeZone })

    return `${local} (${context.timeZone})`
  } catch {
    return `${date.toLocaleString("en-US", { ...TIME_FORMAT, timeZone: "UTC" })} (UTC)`
  }
}
