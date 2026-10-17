import { describe, expect, it } from "vitest"
import { encodeWav } from "./recordingToWav"
import { recordingSeconds } from "../../convex/clientFeedback"
import { MAX_VOICE_FEEDBACK_SEC } from "../../convex/lib/usage"

describe("the voice note's WAV", () => {
  it("is 16 kHz mono 16-bit, so the server reads a full 3 minutes from its size", async () => {
    const wav = encodeWav(new Float32Array(MAX_VOICE_FEEDBACK_SEC * 16_000))
    const header = new DataView(await wav.slice(0, 44).arrayBuffer())

    expect(wav.type).toBe("audio/wav")
    expect(header.getUint32(24, true)).toBe(16_000)
    expect(header.getUint16(22, true)).toBe(1)
    expect(recordingSeconds(wav.size)).toBe(MAX_VOICE_FEEDBACK_SEC)
  })
})
