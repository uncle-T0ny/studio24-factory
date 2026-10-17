import { ConvexError, v } from "convex/values"
import type { MutationCtx } from "./_generated/server"
import { Actor } from "./lib/access"
import { projectMutation } from "./lib/functions"
import { mintVoiceToken } from "./lib/livekitToken"
import { newShareToken } from "./lib/shareToken"
import {
  agentName,
  liveKitKeys,
  sessionsPerDay,
  usageDay,
  VOICE_CAP_REACHED,
  voiceConnectionValidator,
} from "./lib/voice"

// Starts a voice session on a project for its owner or a guest with the share link: counts it
// against the daily cap, records it, and mints the browser's LiveKit token, which dispatches the
// agent. One transaction, so two clicks can't both take the last session of the day, and a
// failed mint counts nothing.

// Counts one session for today, or refuses past VOICE_SESSIONS_PER_DAY.
async function countSession(ctx: MutationCtx, now: number): Promise<void> {
  const cap = sessionsPerDay(process.env.VOICE_SESSIONS_PER_DAY)
  const day = usageDay(now)
  const usage = await ctx.db
    .query("voiceUsage")
    .withIndex("by_day", (q) => q.eq("day", day))
    .unique()
  const used = usage?.sessions ?? 0

  if (used >= cap) {
    throw new ConvexError(VOICE_CAP_REACHED)
  }

  if (usage) {
    await ctx.db.patch(usage._id, { sessions: used + 1 })
  } else {
    await ctx.db.insert("voiceUsage", { day, sessions: 1 })
  }
}

export const startSession = projectMutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: voiceConnectionValidator,
  handler: async (ctx, args) => {
    const { project, actor } = await ctx.access.requireProject(args.projectId)
    const keys = liveKitKeys(process.env)
    const now = Date.now()

    await countSession(ctx, now)

    const roomName = `voice-${newShareToken()}`
    const sessionId = await ctx.db.insert("voiceSessions", {
      ownerId: project.ownerId,
      projectId: project._id,
      roomName,
      startedAt: now,
    })
    const participantToken = await mintVoiceToken(keys, {
      roomName,
      identity: `${actor}-${sessionId}`,
      name: actor === Actor.Owner ? "Owner" : "Guest",
      metadata: JSON.stringify({ sessionId }),
      agentName: agentName(process.env),
    })

    return { serverUrl: keys.url, participantToken, roomName, sessionId }
  },
})
