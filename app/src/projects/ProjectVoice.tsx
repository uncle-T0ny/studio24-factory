import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { VOICE_AGENT_JOIN_TIMEOUT_MS } from "../app.config"
import { VoiceSession } from "../voice/VoiceSession"

export interface ProjectVoiceProps {
  projectId: Id<"projects">
  // A guest's token from the share link; the owner has none.
  shareToken?: string
}

// The voice card on a project's page, for the owner or a guest with the share link: both
// livekit.startSession and voice.saveTypedMessage are projectMutations. Loaded lazily (the
// LiveKit client is large) and only when voice.enabled (ProjectAssistant.tsx).
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
