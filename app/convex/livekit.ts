import { clientMutation } from "./lib/functions"
import { mintVoiceToken } from "./lib/livekitToken"
import { newShareToken } from "./lib/shareToken"
import { spendUsage } from "./lib/usage"
import { agentName, liveKitKeys, voiceConnectionValidator } from "./lib/voice"

export const startSession = clientMutation("interview")({
  args: {},
  returns: voiceConnectionValidator,
  handler: async (ctx) => {
    const { link, project } = ctx.client
    const keys = liveKitKeys(process.env)

    await spendUsage(ctx, "interviews")

    const roomName = `voice-${newShareToken()}`
    const interviewId = await ctx.db.insert("interviews", {
      projectId: project._id,
      linkId: link._id,
      mode: "voice",
      status: "waiting",
      roomName,
      startedAt: Date.now(),
    })
    const participantToken = await mintVoiceToken(keys, {
      roomName,
      identity: `client-${interviewId}`,
      name: "Client",
      metadata: JSON.stringify({ interviewId }),
      agentName: agentName(process.env),
    })

    return { serverUrl: keys.url, participantToken, roomName, interviewId }
  },
})
