export interface TranscriptLine {
  seq: number
  speaker: "agent" | "client"
  text: string
}

const LINE_PREFIX = /^\[\d+\] (agent|client): /

// The one format every model task gets a transcript in; the recorded interview reads it back.
export function transcriptAsData(turns: TranscriptLine[]): string {
  return turns.map((turn) => `[${turn.seq}] ${turn.speaker}: ${turn.text}`).join("\n")
}

export function clientTurnCount(data: string): number {
  return data.split("\n").filter((line) => LINE_PREFIX.exec(line)?.[1] === "client").length
}
