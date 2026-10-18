import {
  RoomAudioRenderer,
  RoomContext,
  useAudioPlayback,
  useTranscriptions,
  useVoiceAssistant,
} from "@livekit/components-react"
import { ConvexError } from "convex/values"
import { Room, RoomEvent, type RemoteParticipant } from "livekit-client"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  agentStatus,
  checkMicrophone,
  microphoneProblem,
  Speaker,
  transcriptLines,
  VOICE_PROBLEMS,
  VoiceProblem,
} from "./voiceStatus"
import { CAP_REACHED } from "../../convex/lib/usage"
import { ChatTranscript } from "../interview/ChatTranscript"
import { useErrorState } from "../lib/errors"
import {
  Badge,
  Button,
  ButtonRow,
  ButtonVariant,
  Callout,
  Card,
  CardHeader,
  Heading,
  HeadingLevel,
  Text,
  TextSize,
  TextTone,
  Tone,
} from "../ui"
import "./voice.css"

export interface VoiceConnectionDetails {
  serverUrl: string
  participantToken: string
}

export interface VoiceSessionProps {
  connect: () => Promise<VoiceConnectionDetails>
  onTypeInstead: (problem: VoiceProblem) => void
  agentJoinTimeoutMs: number
}

enum Attempt {
  Idle = "idle",
  Starting = "starting",
  InRoom = "in-room",
  Ended = "ended",
}

function hasAgent(room: Room): boolean {
  return [...room.remoteParticipants.values()].some((participant) => participant.isAgent)
}

function useVoiceAttempt(room: Room, { connect, agentJoinTimeoutMs }: VoiceSessionProps) {
  const [attempt, setAttempt] = useState(Attempt.Idle)
  const [problem, setProblem] = useState<VoiceProblem | null>(null)
  const { error, setError, showError } = useErrorState()
  const agentTimer = useRef<number | undefined>(undefined)

  const clearAgentTimer = useCallback(() => {
    window.clearTimeout(agentTimer.current)
    agentTimer.current = undefined
  }, [])

  useEffect(() => {
    const onDisconnected = () => {
      clearAgentTimer()
      setAttempt((current) => (current === Attempt.InRoom ? Attempt.Ended : current))
    }
    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      if (participant.isAgent) {
        void room.disconnect()
      }
    }

    room.on(RoomEvent.Disconnected, onDisconnected)
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)

    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected)
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
      clearAgentTimer()
      void room.disconnect()
    }
  }, [room, clearAgentTimer])

  const fail = async (next: VoiceProblem | null, caught?: unknown) => {
    clearAgentTimer()
    setAttempt(Attempt.Idle)
    await room.disconnect()

    if (next) {
      setProblem(next)
    } else {
      showError(caught)
    }
  }

  const start = async () => {
    setError(null)
    setProblem(null)
    setAttempt(Attempt.Starting)

    const blocked = await checkMicrophone()

    if (blocked) {
      await fail(blocked)
      return
    }

    try {
      const { serverUrl, participantToken } = await connect()

      await room.connect(serverUrl, participantToken)
    } catch (caught) {
      const capReached = caught instanceof ConvexError && caught.data === CAP_REACHED

      await fail(capReached ? VoiceProblem.CapReached : null, caught)
      return
    }

    setAttempt(Attempt.InRoom)
    agentTimer.current = window.setTimeout(() => {
      if (!hasAgent(room)) {
        void fail(VoiceProblem.AgentDidNotJoin)
      }
    }, agentJoinTimeoutMs)

    try {
      await room.localParticipant.setMicrophoneEnabled(true)
    } catch (caught) {
      await fail(microphoneProblem(caught))
    }
  }

  const end = () => {
    clearAgentTimer()
    void room.disconnect()
  }

  return { attempt, problem, error, start, end }
}

function LiveTranscript({ room }: { room: Room }) {
  const lines = transcriptLines(useTranscriptions(), room.localParticipant.identity)

  if (lines.length === 0) {
    return null
  }

  return (
    <ChatTranscript
      label="Live transcript"
      lines={lines.map((line) => ({
        key: line.id,
        speaker: line.speaker === Speaker.You ? "client" : "agent",
        label: line.speaker,
        text: line.text,
      }))}
    />
  )
}

function SessionStatus({ attempt }: { attempt: Attempt }) {
  const { agent, state } = useVoiceAssistant()

  if (attempt === Attempt.Starting) {
    return <Badge>Starting…</Badge>
  }

  if (attempt !== Attempt.InRoom) {
    return null
  }

  if (!agent) {
    return <Badge>Waiting for the assistant…</Badge>
  }

  const status = agentStatus(state)

  return <Badge tone={status.tone}>{status.label}</Badge>
}

function VoiceCard({ room, ...props }: VoiceSessionProps & { room: Room }) {
  const { attempt, problem, error, start, end } = useVoiceAttempt(room, props)
  const { canPlayAudio, startAudio } = useAudioPlayback(room)
  const isInRoom = attempt === Attempt.InRoom

  return (
    <Card label="Voice assistant">
      <CardHeader
        actions={
          <ButtonRow>
            <SessionStatus attempt={attempt} />
            {isInRoom ? (
              <Button variant={ButtonVariant.Danger} onClick={end}>
                End
              </Button>
            ) : (
              <Button
                variant={ButtonVariant.Primary}
                disabled={attempt === Attempt.Starting}
                onClick={() => void start()}
              >
                {problem ? "Try again" : "Start talking"}
              </Button>
            )}
          </ButtonRow>
        }
      >
        <Heading level={HeadingLevel.Section}>Voice assistant</Heading>
      </CardHeader>
      <Text tone={TextTone.Muted} size={TextSize.Small}>
        Talk with the interviewer out loud. The transcript is saved with your project.
      </Text>
      {isInRoom && !canPlayAudio ? (
        <Button onClick={() => void startAudio()}>Turn on the sound</Button>
      ) : null}
      {attempt === Attempt.Ended ? <Text tone={TextTone.Muted}>The session ended.</Text> : null}
      {error ? (
        <Text tone={TextTone.Danger} alert>
          {error}
        </Text>
      ) : null}
      {problem ? (
        <div className="voice-fallback">
          <Callout tone={Tone.Warning} title={VOICE_PROBLEMS[problem].title}>
            <Text size={TextSize.Small}>{VOICE_PROBLEMS[problem].body}</Text>
          </Callout>
          <div>
            <Button onClick={() => props.onTypeInstead(problem)}>Type your answers instead</Button>
          </div>
        </div>
      ) : null}
      <LiveTranscript room={room} />
      <RoomAudioRenderer />
    </Card>
  )
}

// Not components-react's useSession: it mints a token on mount, and each token counts against the daily cap.
export function VoiceSession(props: VoiceSessionProps) {
  const [room] = useState(() => new Room())

  return (
    <RoomContext.Provider value={room}>
      <VoiceCard room={room} {...props} />
    </RoomContext.Provider>
  )
}
