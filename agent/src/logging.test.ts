import { initializeLogger, log } from "@livekit/agents"
import { afterEach, describe, expect, it, vi } from "vitest"
import { carriesTranscript, quietTranscripts } from "./logging.ts"

// The framework's logger (pino) writes JSON lines to stdout when it isn't pretty.
function captured(level: string, write: () => void): string {
  const lines: string[] = []
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
    lines.push(String(chunk))

    return true
  })

  initializeLogger({ pretty: false, level })
  expect(quietTranscripts(log())).toBe(true)
  write()
  spy.mockRestore()

  return lines.join("")
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("quietTranscripts", () => {
  it("keeps what a user said out of info logs, children included", () => {
    const output = captured("info", () => {
      log().child({ roomName: "voice-1" }).info({ "lk.pii.user_input": "my words" }, "user input")
      log().info({ roomName: "voice-1" }, "session started")
    })

    expect(output).not.toContain("my words")
    expect(output).toContain("session started")
  })

  it("still shows it at debug", () => {
    const output = captured("debug", () => {
      log().child({ roomName: "voice-1" }).info({ "lk.pii.user_input": "my words" }, "user input")
    })

    expect(output).toContain("my words")
  })
})

describe("carriesTranscript", () => {
  it("looks for lk.pii fields in the first argument", () => {
    expect(carriesTranscript([{ "lk.pii.new_transcript": "hi" }, "msg"])).toBe(true)
    expect(carriesTranscript([{ roomName: "voice-1" }, "msg"])).toBe(false)
    expect(carriesTranscript(["just a message"])).toBe(false)
  })
})
