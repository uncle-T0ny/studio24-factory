import { ConvexError } from "convex/values"
import type { ReadCtx } from "./access"
import {
  type FeedbackStatus,
  isScreenshotType,
  MAX_SCREENSHOT_BYTES,
  type FeedbackEntry,
} from "./feedback"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"

// The database side of feedback; lib/feedback.ts is pure and shared with src.

const LIST_LIMIT = 500
const SCREENSHOT_MISSING = "The screenshot didn't upload. Try again."
const SCREENSHOT_REFUSED = "The screenshot must be a PNG or JPG under 3 MB."

export async function assertScreenshot(
  ctx: MutationCtx,
  screenshotId: Id<"_storage">,
): Promise<void> {
  const file = await ctx.db.system.get(screenshotId)

  if (!file) {
    throw new ConvexError(SCREENSHOT_MISSING)
  }

  const isAccepted = isScreenshotType(file.contentType) && file.size <= MAX_SCREENSHOT_BYTES

  if (!isAccepted) {
    throw new ConvexError(SCREENSHOT_REFUSED)
  }
}

async function newestFeedback(
  ctx: ReadCtx,
  status: FeedbackStatus | undefined,
): Promise<Doc<"feedback">[]> {
  if (status === undefined) {
    return await ctx.db.query("feedback").withIndex("by_createdAt").order("desc").take(LIST_LIMIT)
  }

  return await ctx.db
    .query("feedback")
    .withIndex("by_status", (q) => q.eq("status", status))
    .order("desc")
    .take(LIST_LIMIT)
}

// Newest first, each with its author's email and a URL for its screenshot.
export async function readFeedbackEntries(
  ctx: ReadCtx,
  status: FeedbackStatus | undefined,
): Promise<FeedbackEntry[]> {
  const rows = await newestFeedback(ctx, status)
  const emails = new Map<Id<"users">, string | null>()
  const entries: FeedbackEntry[] = []

  for (const row of rows) {
    if (!emails.has(row.ownerId)) {
      const author = await ctx.db.get(row.ownerId)

      emails.set(row.ownerId, author?.email ?? null)
    }

    const screenshotUrl = row.screenshotId ? await ctx.storage.getUrl(row.screenshotId) : null

    entries.push({
      id: row._id,
      type: row.type,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      context: row.context,
      authorEmail: emails.get(row.ownerId) ?? null,
      screenshotUrl,
    })
  }

  return entries
}
