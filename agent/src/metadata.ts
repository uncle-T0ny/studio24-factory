// What the app puts in the dispatch (app/convex/livekit.ts): the id of its voiceSessions row.
// Per-session context for the agent (whose record this is, which prompt to use) goes here too.

export interface JobMetadata {
  sessionId: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

// The job's metadata string, parsed; anything unexpected reads as no metadata.
export function parseJobMetadata(raw: string | undefined): JobMetadata {
  if (raw === undefined || raw.length === 0) {
    return { sessionId: null }
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return { sessionId: null }
  }

  const sessionId = isRecord(parsed) ? parsed.sessionId : undefined

  return { sessionId: typeof sessionId === "string" && sessionId.length > 0 ? sessionId : null }
}
