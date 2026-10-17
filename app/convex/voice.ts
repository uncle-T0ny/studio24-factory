import { v } from "convex/values"
import { internalMutation } from "./_generated/server"
import { projectMutation, publicQuery } from "./lib/functions"
import {
  agentEventValidator,
  cleanTypedMessage,
  isVoiceEnabled,
  TranscriptSource,
  VoiceRole,
} from "./lib/voice"
import { recordAgentEvent } from "./lib/voiceData"

export const enabled = publicQuery({
  args: {},
  returns: v.boolean(),
  handler: () => isVoiceEnabled(process.env),
})

export const saveTypedMessage = projectMutation({
  args: {
    projectId: v.id("projects"),
    text: v.string(),
  },
  returns: v.id("voiceTranscripts"),
  handler: async (ctx, args) => {
    const { project } = await ctx.access.requireProject(args.projectId)

    return await ctx.db.insert("voiceTranscripts", {
      ownerId: project.ownerId,
      projectId: project._id,
      role: VoiceRole.User,
      text: cleanTypedMessage(args.text),
      at: Date.now(),
      source: TranscriptSource.Typed,
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
