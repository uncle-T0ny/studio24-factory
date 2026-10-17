import {
  RoomAudioRenderer,
  RoomContext,
  useAudioPlayback,
  useTranscriptions,
  useVoiceAssistant,
} from "@livekit/components-react"
import { Room, RoomEvent, type RemoteParticipant } from "livekit-client"
import { useCallback, useEffect, useRef, useState } from "react"
import { TypedFallback } from "./TypedFallback"
import {
  agentStatus,
  checkMicrophone,
  microphoneProblem,
  transcriptLines,
  VOICE_PROBLEMS,
  VoiceProblem,
} from "./voiceStatus"
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
  List,
  ListRow,
  Text,
  TextSize,
  TextTone,
  Tone,
} from "../ui"
import "./voice.css"

// A voice session with the agent (agent/), on the UI kit. Start asks for the microphone first,
// then calls `connect`, which mints the LiveKit token (convex/livekit.ts), and joins the room;
// the token dispatches the agent. The page shows the agent's state and the live transcript, and
// a typed fallback when the microphone is blocked or the agent doesn't join in time.
//
// It manages the Room itself instead of components-react's useSession: useSession fetches a
// token as soon as it mounts (prepareConnection), and here every token counts against the
// deployment's daily cap, so a token is minted only on a Start click.

export interface VoiceConnectionDetails {
  serverUrl: string
  participantToken: string
}

export interface VoiceSessionProps {
  // Mints a token for a new session; called once per Start, after the microphone works.
  connect: () => Promise<VoiceConnectionDetails>
  // Saves a message typed in the fallback form.
  onTypedMessage: (text: string) => Promise<void>
  // How long to wait for the agent to join before offering the fallback.
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
    // The agent leaving ends the session (its time limit, or an error on its side).
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
      await fail(null, caught)
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
    <List label="Live transcript">
      {lines.map((line) => (
        <ListRow key={line.id} title={line.text} meta={line.speaker} />
      ))}
    </List>
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
  const problemText = problem ? VOICE_PROBLEMS[problem] : null

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
        Talk with the assistant out loud. The transcript is saved with the project.
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
      {problemText ? (
        <div className="voice-fallback">
          <Callout tone={Tone.Warning} title={problemText.title}>
            <Text size={TextSize.Small}>{problemText.body}</Text>
          </Callout>
          <TypedFallback onSend={props.onTypedMessage} />
        </div>
      ) : null}
      <LiveTranscript room={room} />
      <RoomAudioRenderer />
    </Card>
  )
}

export function VoiceSession(props: VoiceSessionProps) {
  const [room] = useState(() => new Room())

  return (
    <RoomContext.Provider value={room}>
      <VoiceCard room={room} {...props} />
    </RoomContext.Provider>
  )
}
