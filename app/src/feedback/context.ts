import { browserSummary, type FeedbackContext, type Viewport } from "../../convex/lib/feedback"
import { APP_VERSION } from "../appVersion"

export interface FeedbackTarget {
  projectId: string
}

export interface ContextInput {
  pathname: string
  search: string
  userAgent: string
  viewport: Viewport
  now: Date
  timeZone: string
  appVersion: string
  target?: FeedbackTarget
}

const UNKNOWN_TIME_ZONE = "unknown"

function pathOf(input: ContextInput): string {
  const query = new URLSearchParams(input.search).toString()

  return query.length > 0 ? `${input.pathname}?${query}` : input.pathname
}

export function captureContext(input: ContextInput): FeedbackContext {
  const context: FeedbackContext = {
    path: pathOf(input),
    appVersion: input.appVersion,
    userAgent: input.userAgent,
    viewport: {
      width: Math.round(input.viewport.width),
      height: Math.round(input.viewport.height),
    },
    time: input.now.toISOString(),
    timeZone: input.timeZone,
  }

  if (input.target) {
    context.projectId = input.target.projectId
  }

  return context
}

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || UNKNOWN_TIME_ZONE
  } catch {
    return UNKNOWN_TIME_ZONE
  }
}

export function currentContext(target?: FeedbackTarget): FeedbackContext {
  return captureContext({
    pathname: window.location.pathname,
    search: window.location.search,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    now: new Date(),
    timeZone: browserTimeZone(),
    appVersion: APP_VERSION,
    target,
  })
}

export function viewportText(viewport: Viewport): string {
  return `${viewport.width} × ${viewport.height}`
}

export function contextSummary(context: FeedbackContext): string {
  const parts = [
    context.path,
    browserSummary(context.userAgent),
    viewportText(context.viewport),
    `version ${context.appVersion}`,
  ]

  return `Sent with: ${parts.join(" · ")}`
}
