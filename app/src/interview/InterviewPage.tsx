import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { TextInterview } from "./TextInterview"
import { api } from "../../convex/_generated/api"
import { VOICE_AGENT_JOIN_TIMEOUT_MS } from "../app.config"
import { useErrorState } from "../lib/errors"
import { Button, ButtonVariant, Card, PageColumn, PageHeader, Text, TextTone } from "../ui"
import { VoiceSession } from "../voice/VoiceSession"
import { interviewFailure, type VoiceProblem } from "../voice/voiceStatus"

export function InterviewPage() {
  const token = useParams().token ?? ""
  const voiceEnabled = useQuery(api.voice.enabled)
  const view = useQuery(api.interviews.current, { token })
  const startSession = useMutation(api.livekit.startSession)
  const startText = useMutation(api.interviews.startText)
  const [isStarting, setIsStarting] = useState(false)
  const { error, showError } = useErrorState()

  const start = async (problem?: VoiceProblem) => {
    setIsStarting(true)

    try {
      await startText({ token, failure: problem && interviewFailure(problem) })
    } catch (caught) {
      showError(caught)
    } finally {
      setIsStarting(false)
    }
  }

  const isLoading = voiceEnabled === undefined || view === undefined
  const showsTranscript = view && (view.mode === "text" || view.status === "done")

  return (
    <PageColumn>
      <PageHeader title="Interview" />
      <Text tone={TextTone.Muted}>
        A few questions about the app you want: the idea first, then your business and constraints.
      </Text>
      {isLoading ? null : showsTranscript ? (
        <TextInterview token={token} view={view} />
      ) : voiceEnabled ? (
        <VoiceSession
          connect={() => startSession({ token })}
          onTypeInstead={(problem) => void start(problem)}
          agentJoinTimeoutMs={VOICE_AGENT_JOIN_TIMEOUT_MS}
        />
      ) : (
        <Card label="Text interview">
          <div>
            <Button
              variant={ButtonVariant.Primary}
              disabled={isStarting}
              onClick={() => void start()}
            >
              Start the interview
            </Button>
          </div>
        </Card>
      )}
      {error ? (
        <Text tone={TextTone.Danger} alert>
          {error}
        </Text>
      ) : null}
    </PageColumn>
  )
}
