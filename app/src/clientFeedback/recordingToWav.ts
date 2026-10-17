const SAMPLE_RATE = 16_000
const HEADER_BYTES = 44

export function encodeWav(samples: Float32Array): Blob {
  const wav = new DataView(new ArrayBuffer(HEADER_BYTES + samples.length * 2))
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      wav.setUint8(offset + i, text.charCodeAt(i))
    }
  }

  writeText(0, "RIFF")
  wav.setUint32(4, HEADER_BYTES - 8 + samples.length * 2, true)
  writeText(8, "WAVE")
  writeText(12, "fmt ")
  wav.setUint32(16, 16, true)
  wav.setUint16(20, 1, true)
  wav.setUint16(22, 1, true)
  wav.setUint32(24, SAMPLE_RATE, true)
  wav.setUint32(28, SAMPLE_RATE * 2, true)
  wav.setUint16(32, 2, true)
  wav.setUint16(34, 16, true)
  writeText(36, "data")
  wav.setUint32(40, samples.length * 2, true)
  samples.forEach((sample, i) => {
    wav.setInt16(HEADER_BYTES + i * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true)
  })

  return new Blob([wav], { type: "audio/wav" })
}

// MediaRecorder gives WebM or MP4, which MAI-Transcribe doesn't take; decoding in a 16 kHz
// context resamples the note to the mono WAV the server measures and sends.
export async function recordingToWav(recording: Blob, maxSeconds: number): Promise<Blob> {
  const context = new OfflineAudioContext(1, 1, SAMPLE_RATE)
  const audio = await context.decodeAudioData(await recording.arrayBuffer())

  return encodeWav(audio.getChannelData(0).subarray(0, maxSeconds * SAMPLE_RATE))
}
