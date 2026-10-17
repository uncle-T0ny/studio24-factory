// What every LLM request adds to its body for OpenRouter. The OpenAI plugin unpacks
// extraKwargs.extra_body into the request body, and the agent session calls chat() without
// extraKwargs, so main.ts adds these in a small subclass of the plugin's LLM.

export type ExtraKwargs = Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

// Claude on OpenRouter thinks by default (adaptive), which a voice turn can't wait for:
// `reasoning: { enabled: false }` turns it off (OpenRouter sends thinking "disabled" upstream).
export function withThinkingOff(extraKwargs: ExtraKwargs | undefined): ExtraKwargs {
  const extraBody = isRecord(extraKwargs?.extra_body) ? extraKwargs.extra_body : {}

  return {
    ...extraKwargs,
    extra_body: { ...extraBody, reasoning: { enabled: false } },
  }
}
