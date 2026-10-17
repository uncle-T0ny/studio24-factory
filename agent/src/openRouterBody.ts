export type ExtraKwargs = Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

// Claude on OpenRouter thinks by default, which a voice turn can't wait for.
export function withThinkingOff(extraKwargs: ExtraKwargs | undefined): ExtraKwargs {
  const extraBody = isRecord(extraKwargs?.extra_body) ? extraKwargs.extra_body : {}

  return {
    ...extraKwargs,
    extra_body: { ...extraBody, reasoning: { enabled: false } },
  }
}
