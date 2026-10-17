import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { VOICE_AGENT_JOIN_TIMEOUT_MS } from "../app.config"
import { VoiceSession } from "../voice/VoiceSession"

export interface ProjectVoiceProps {
  projectId: Id<"projects">
  shareToken?: string
}

export default function ProjectVoice({ projectId, shareToken }: ProjectVoiceProps) {
  const startSession = useMutation(api.livekit.startSession)
  const saveTypedMessage = useMutation(api.voice.saveTypedMessage)

  return (
    <VoiceSession
      connect={() => startSession({ projectId, shareToken })}
      onTypedMessage={async (text) => {
        await saveTypedMessage({ projectId, text, shareToken })
      }}
      agentJoinTimeoutMs={VOICE_AGENT_JOIN_TIMEOUT_MS}
    />
  )
}
