import { useMutation } from "convex/react"
import { useRef } from "react"
import { useParams } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { VOICE_AGENT_JOIN_TIMEOUT_MS } from "../app.config"
import { PageColumn, PageHeader } from "../ui"
import { VoiceSession } from "../voice/VoiceSession"

export function InterviewPage() {
  const token = useParams().token ?? ""
  const startSession = useMutation(api.livekit.startSession)
  const saveTypedMessage = useMutation(api.voice.saveTypedMessage)
  const interviewId = useRef<Id<"interviews"> | null>(null)

  const connect = async () => {
    const connection = await startSession({ token })

    interviewId.current = connection.interviewId

    return connection
  }

  const sendTyped = async (text: string) => {
    if (interviewId.current === null) {
      throw new Error("Start the interview first.")
    }

    await saveTypedMessage({ token, interviewId: interviewId.current, text })
  }

  return (
    <PageColumn>
      <PageHeader title="Interview" />
      <VoiceSession
        connect={connect}
        onTypedMessage={sendTyped}
        agentJoinTimeoutMs={VOICE_AGENT_JOIN_TIMEOUT_MS}
      />
    </PageColumn>
  )
}
