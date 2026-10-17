import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk"
import type { LiveKitKeys } from "./voice"

// A LiveKit access token for one participant in one room. livekit-server-sdk runs in Convex's
// default runtime (it signs with WebCrypto through jose), so no "use node" is needed and the
// mint can share a mutation with the cap and the session row.

// Long enough to connect; the server refreshes a connected client's token itself.
export const TOKEN_TTL = "10m"

export interface VoiceGrant {
  roomName: string
  identity: string
  name: string
  // The agent reads it as ctx.job.metadata (agent/src/metadata.ts).
  metadata: string
  // The worker to dispatch: agentName() in lib/voice.ts, the worker's AGENT_NAME.
  agentName: string
}

// The token joins the room and dispatches the agent by name. The dispatch applies only when this
// join creates the room, so every session gets a new room name and nothing creates it first.
export async function mintVoiceToken(keys: LiveKitKeys, grant: VoiceGrant): Promise<string> {
  const token = new AccessToken(keys.apiKey, keys.apiSecret, {
    identity: grant.identity,
    name: grant.name,
    ttl: TOKEN_TTL,
  })

  token.addGrant({
    room: grant.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })
  token.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: grant.agentName, metadata: grant.metadata })],
  })

  return await token.toJwt()
}
