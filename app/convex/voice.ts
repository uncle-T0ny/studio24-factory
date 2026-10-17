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

// The voice module's transcript: what the agent sends (through convex/http.ts), and the message
// a user types when voice doesn't work. convex/livekit.ts starts the sessions.

// Whether voice is on here (lib/voice.ts, VOICE_KEYS). Off, the project pages show no voice
// card and no mic, only the typed message; livekit.startSession refuses too.
export const enabled = publicQuery({
  args: {},
  returns: v.boolean(),
  handler: () => isVoiceEnabled(process.env),
})

// The typed message: the only input when voice is off, and the fallback when the microphone is
// blocked or the agent doesn't join. The owner or a guest leaves it on the project.
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

// For the HTTP action only, which has checked the agent's secret.
export const recordEvent = internalMutation({
  args: {
    event: agentEventValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => await recordAgentEvent(ctx, args.event),
})
