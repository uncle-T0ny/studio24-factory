import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk"
import { MAX_INTERVIEW_SEC } from "./usage"
import type { LiveKitKeys } from "./voice"

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
    ttl: MAX_INTERVIEW_SEC,
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
