import { v } from "convex/values"
import { internalMutation } from "./_generated/server"
import { clientMutation, publicQuery } from "./lib/functions"
import { agentEventValidator, cleanTypedMessage, isVoiceEnabled } from "./lib/voice"
import { recordAgentEvent } from "./lib/voiceData"

export const enabled = publicQuery({
  args: {},
  returns: v.boolean(),
  handler: () => isVoiceEnabled(process.env),
})

export const saveTypedMessage = clientMutation("interview")({
  args: {
    interviewId: v.id("interviews"),
    text: v.string(),
  },
  returns: v.id("transcriptTurns"),
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.interviewId)

    if (interview?.projectId !== ctx.client.project._id) {
      throw new Error("No such interview.")
    }

    const last = await ctx.db
      .query("transcriptTurns")
      .withIndex("by_interview", (q) => q.eq("interviewId", interview._id))
      .order("desc")
      .first()

    return await ctx.db.insert("transcriptTurns", {
      interviewId: interview._id,
      projectId: interview.projectId,
      seq: (last?.seq ?? -1) + 1,
      speaker: "client",
      text: cleanTypedMessage(args.text),
      at: Date.now(),
    })
  },
})

export const recordEvent = internalMutation({
  args: {
    event: agentEventValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => await recordAgentEvent(ctx, args.event),
})
