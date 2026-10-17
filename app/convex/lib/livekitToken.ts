import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk"
import type { LiveKitKeys } from "./voice"

export const TOKEN_TTL = "10m"

export interface VoiceGrant {
  roomName: string
  identity: string
  name: string
  metadata: string
  agentName: string
}

// The dispatch applies only when this join creates the room, so each session needs a new room name.
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
