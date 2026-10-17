// The worker's settings, read once from the environment (.env.example lists them). The LiveKit
// SDK reads LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET itself; they are checked here
// too, so a missing one stops the worker with one clear message instead of a connection error.

export const DEFAULT_OPENROUTER_MODEL = "anthropic/claude-haiku-5.5"
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
export const DEFAULT_MAX_SECONDS = 300
// The name the worker registers under when AGENT_NAME is unset. The app's token dispatches the
// same AGENT_NAME (app/convex/lib/voice.ts), so two workers in one LiveKit project, each with
// its own name, never take each other's jobs.
export const DEFAULT_AGENT_NAME = "voice-assistant"
const MAX_MAX_SECONDS = 3600

const REQUIRED = [
  "LIVEKIT_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "DEEPGRAM_API_KEY",
  "OPENROUTER_API_KEY",
  "CONVEX_SITE_URL",
  "VOICE_AGENT_SECRET",
] as const

export interface AgentConfig {
  agentName: string
  // Speech in (Nova-3) and out (Aura-2) through the Deepgram plugin.
  deepgramApiKey: string
  openRouterApiKey: string
  openRouterModel: string
  // The Convex deployment's HTTP actions origin, https://<deployment-name>.convex.site.
  convexSiteUrl: string
  agentSecret: string
  maxSessionMs: number
}

export type Env = Readonly<Record<string, string | undefined>>

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConfigError"
  }
}

function value(env: Env, name: string): string {
  return env[name]?.trim() ?? ""
}

function siteUrl(raw: string): string {
  let url: URL

  try {
    url = new URL(raw)
  } catch {
    throw new ConfigError(`CONVEX_SITE_URL must be a URL, such as https://<name>.convex.site.`)
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ConfigError("CONVEX_SITE_URL must be an http(s) URL.")
  }

  return url.origin
}

function maxSeconds(raw: string): number {
  if (raw.length === 0) {
    return DEFAULT_MAX_SECONDS
  }

  const seconds = Number(raw)
  const isValid = Number.isInteger(seconds) && seconds > 0 && seconds <= MAX_MAX_SECONDS

  if (!isValid) {
    throw new ConfigError(`VOICE_MAX_SECONDS must be a whole number from 1 to ${MAX_MAX_SECONDS}.`)
  }

  return seconds
}

export function readConfig(env: Env): AgentConfig {
  const missing = REQUIRED.filter((name) => value(env, name).length === 0)

  if (missing.length > 0) {
    throw new ConfigError(`Set ${missing.join(", ")} (see agent/.env.example).`)
  }

  const model = value(env, "OPENROUTER_MODEL")
  const agentName = value(env, "AGENT_NAME")

  return {
    agentName: agentName.length > 0 ? agentName : DEFAULT_AGENT_NAME,
    deepgramApiKey: value(env, "DEEPGRAM_API_KEY"),
    openRouterApiKey: value(env, "OPENROUTER_API_KEY"),
    openRouterModel: model.length > 0 ? model : DEFAULT_OPENROUTER_MODEL,
    convexSiteUrl: siteUrl(value(env, "CONVEX_SITE_URL")),
    agentSecret: value(env, "VOICE_AGENT_SECRET"),
    maxSessionMs: maxSeconds(value(env, "VOICE_MAX_SECONDS")) * 1000,
  }
}
