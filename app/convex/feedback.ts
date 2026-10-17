import { ConvexError, v } from "convex/values"
import { internalQuery } from "./_generated/server"
import {
  cleanFeedbackContext,
  cleanFeedbackMessage,
  feedbackContextValidator,
  feedbackEntriesValidator,
  FeedbackStatus,
  feedbackStatusValidator,
  feedbackTypeValidator,
} from "./lib/feedback"
import { assertScreenshot, readFeedbackEntries } from "./lib/feedbackEntries"
import { ownerMutation, ownerQuery } from "./lib/functions"

// In-app feedback. Every public function requires a signed-in owner, the same check as
// the rest of the app (ownerQuery and ownerMutation), and every owner sees every entry.
// listForTriage is internal: `npm run feedback` (scripts/feedback.ts) runs it.

const FEEDBACK_MISSING = "This feedback no longer exists."

export const generateUploadUrl = ownerMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
})

export const create = ownerMutation({
  args: {
    type: feedbackTypeValidator,
    message: v.string(),
    screenshotId: v.optional(v.id("_storage")),
    context: feedbackContextValidator,
  },
  returns: v.id("feedback"),
  handler: async (ctx, args) => {
    const message = cleanFeedbackMessage(args.message)

    if (args.screenshotId !== undefined) {
      await assertScreenshot(ctx, args.screenshotId)
    }

    return await ctx.db.insert("feedback", {
      ownerId: ctx.ownerId,
      type: args.type,
      message,
      screenshotId: args.screenshotId,
      context: cleanFeedbackContext(args.context),
      createdAt: Date.now(),
      status: FeedbackStatus.New,
    })
  },
})

export const list = ownerQuery({
  args: {
    status: v.optional(feedbackStatusValidator),
  },
  returns: feedbackEntriesValidator,
  handler: async (ctx, args) => await readFeedbackEntries(ctx, args.status),
})

export const setStatus = ownerMutation({
  args: {
    feedbackId: v.id("feedback"),
    status: feedbackStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.feedbackId)

    if (!row) {
      throw new ConvexError(FEEDBACK_MISSING)
    }

    await ctx.db.patch(args.feedbackId, {
      status: args.status,
    })

    return null
  },
})

// For triage by Claude: `npm run feedback -- [--prod] [--all]` prints these as Markdown.
export const listForTriage = internalQuery({
  args: {
    includeDone: v.boolean(),
  },
  returns: feedbackEntriesValidator,
  handler: async (ctx, args) => {
    return await readFeedbackEntries(ctx, args.includeDone ? undefined : FeedbackStatus.New)
  },
})
