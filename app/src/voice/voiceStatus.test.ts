import { describe, expect, it } from "vitest"
import {
  agentStatus,
  microphoneProblem,
  Speaker,
  transcriptLines,
  VOICE_PROBLEMS,
  VoiceProblem,
} from "./voiceStatus"
import { Tone } from "../ui"

describe("microphoneProblem", () => {
  it("tells a blocked, a missing and a busy microphone apart", () => {
    const failure = (name: string) => new DOMException("failed", name)

    expect(microphoneProblem(failure("NotAllowedError"))).toBe(VoiceProblem.MicBlocked)
    expect(microphoneProblem(failure("NotFoundError"))).toBe(VoiceProblem.MicMissing)
    expect(microphoneProblem(failure("NotReadableError"))).toBe(VoiceProblem.MicBusy)
    expect(microphoneProblem(new Error("odd"))).toBe(VoiceProblem.MicUnavailable)
  })

  it("offers the typed message for every problem", () => {
    for (const problem of Object.values(VoiceProblem)) {
      expect(VOICE_PROBLEMS[problem].body).toMatch(/type your message below\.$/)
    }
  })
})

describe("agentStatus", () => {
  it("names what the agent is doing", () => {
    expect(agentStatus("listening")).toEqual({ label: "Listening", tone: Tone.Accent })
    expect(agentStatus("thinking").label).toBe("Thinking")
    expect(agentStatus("speaking").label).toBe("Speaking")
    expect(agentStatus("initializing").label).toBe("Getting ready")
    expect(agentStatus("failed").tone).toBe(Tone.Danger)
  })
})

describe("transcriptLines", () => {
  it("puts both sides in spoken order and drops empty streams", () => {
    const stream = (id: string, identity: string, text: string, timestamp: number) => ({
      text,
      participantInfo: { identity },
      streamInfo: { id, timestamp },
    })

    expect(
      transcriptLines(
        [
          stream("b", "owner-1", " What's the time? ", 20),
          stream("a", "agent-1", "Hello! How can I help?", 10),
          stream("c", "agent-1", "  ", 30),
        ],
        "owner-1",
      ),
    ).toEqual([
      { id: "a", speaker: Speaker.Assistant, text: "Hello! How can I help?" },
      { id: "b", speaker: Speaker.You, text: "What's the time?" },
    ])
  })
})
