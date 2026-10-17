import type { AgentState } from "@livekit/components-react"
import { MediaDeviceFailure } from "livekit-client"
import { Tone } from "../ui"

// The voice card's words and rules, kept apart from the component so they can be tested.

export enum VoiceProblem {
  MicBlocked = "mic-blocked",
  MicMissing = "mic-missing",
  MicBusy = "mic-busy",
  MicUnavailable = "mic-unavailable",
  AgentDidNotJoin = "agent-did-not-join",
}

export interface ProblemText {
  title: string
  body: string
}

export const VOICE_PROBLEMS: Record<VoiceProblem, ProblemText> = {
  [VoiceProblem.MicBlocked]: {
    title: "The microphone is blocked.",
    body: "Allow it for this site in your browser's site settings, then try again. Or type your message below.",
  },
  [VoiceProblem.MicMissing]: {
    title: "No microphone found.",
    body: "Plug one in and try again, or type your message below.",
  },
  [VoiceProblem.MicBusy]: {
    title: "The microphone is in use by another app.",
    body: "Close that app and try again, or type your message below.",
  },
  [VoiceProblem.MicUnavailable]: {
    title: "This browser can't use the microphone here.",
    body: "Try another browser, or type your message below.",
  },
  [VoiceProblem.AgentDidNotJoin]: {
    title: "The assistant didn't join.",
    body: "It may be starting up or offline. Try again in a minute, or type your message below.",
  },
}

// The problem a failed microphone request names (getUserMedia, or LiveKit's own request).
export function microphoneProblem(error: unknown): VoiceProblem {
  switch (MediaDeviceFailure.getFailure(error)) {
    case MediaDeviceFailure.PermissionDenied:
      return VoiceProblem.MicBlocked
    case MediaDeviceFailure.NotFound:
      return VoiceProblem.MicMissing
    case MediaDeviceFailure.DeviceInUse:
      return VoiceProblem.MicBusy
    default:
      return VoiceProblem.MicUnavailable
  }
}

// Asks for the microphone, then lets it go again: the session starts only once it works, so a
// blocked microphone costs no token, no session and no agent minutes.
export async function checkMicrophone(): Promise<VoiceProblem | null> {
  if (typeof navigator === "undefined" || !("mediaDevices" in navigator)) {
    return VoiceProblem.MicUnavailable
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    for (const track of stream.getTracks()) {
      track.stop()
    }

    return null
  } catch (error) {
    return microphoneProblem(error)
  }
}

export interface AgentStatus {
  label: string
  tone: Tone
}

export function agentStatus(state: AgentState): AgentStatus {
  switch (state) {
    case "listening":
      return { label: "Listening", tone: Tone.Accent }
    case "thinking":
      return { label: "Thinking", tone: Tone.Warning }
    case "speaking":
      return { label: "Speaking", tone: Tone.Accent }
    case "failed":
      return { label: "Not available", tone: Tone.Danger }
    case "disconnected":
      return { label: "Not connected", tone: Tone.Neutral }
    case "connecting":
    case "pre-connect-buffering":
    case "initializing":
    case "idle":
      return { label: "Getting ready", tone: Tone.Neutral }
  }
}

export enum Speaker {
  You = "You",
  Assistant = "Assistant",
}

// One transcription stream as useTranscriptions gives it (TextStreamData).
export interface TranscriptionStream {
  text: string
  participantInfo: { identity: string }
  streamInfo: { id: string; timestamp: number }
}

export interface TranscriptLine {
  id: string
  speaker: Speaker
  text: string
}

// The live transcript in the order it was spoken. The agent publishes both sides; the user's
// own words carry the user's identity, the way components-react's useSessionMessages tells them.
export function transcriptLines(
  streams: readonly TranscriptionStream[],
  localIdentity: string,
): TranscriptLine[] {
  return [...streams]
    .filter((stream) => stream.text.trim().length > 0)
    .sort((a, b) => a.streamInfo.timestamp - b.streamInfo.timestamp)
    .map((stream) => ({
      id: stream.streamInfo.id,
      speaker: stream.participantInfo.identity === localIdentity ? Speaker.You : Speaker.Assistant,
      text: stream.text.trim(),
    }))
}
