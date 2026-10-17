import { v } from "convex/values"
import { internalMutation } from "./_generated/server"
import { publicQuery } from "./lib/functions"
import { agentEventValidator, isVoiceEnabled } from "./lib/voice"
import { recordAgentEvent } from "./lib/voiceData"

export const enabled = publicQuery({
  args: {},
  returns: v.boolean(),
  handler: () => isVoiceEnabled(process.env),
})

export const recordEvent = internalMutation({
  args: {
    event: agentEventValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => await recordAgentEvent(ctx, args.event),
})
