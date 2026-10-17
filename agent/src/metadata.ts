export interface JobMetadata {
  interviewId: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function parseJobMetadata(raw: string | undefined): JobMetadata {
  if (raw === undefined || raw.length === 0) {
    return { interviewId: null }
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return { interviewId: null }
  }

  const interviewId = isRecord(parsed) ? parsed.interviewId : undefined

  return {
    interviewId: typeof interviewId === "string" && interviewId.length > 0 ? interviewId : null,
  }
}
