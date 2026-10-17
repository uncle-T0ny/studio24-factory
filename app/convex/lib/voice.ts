import { ConvexError, v, type Infer } from "convex/values"

export const DEFAULT_AGENT_NAME = "voice-assistant"

export const VOICE_KEYS = [
  "LIVEKIT_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "DEEPGRAM_API_KEY",
  "OPENROUTER_API_KEY",
] as const

export const AGENT_EVENTS_PATH = "/voice/agent-events"

export const MAX_TURN_LENGTH = 4000
export const MAX_TURNS = 500

export const VOICE_NOT_SET_UP =
  "Voice is off on this deployment: it needs its LiveKit, Deepgram and OpenRouter keys."

export enum VoiceRole {
  User = "user",
  Assistant = "assistant",
}

export const voiceRoleValidator = v.union(v.literal(VoiceRole.User), v.literal(VoiceRole.Assistant))

export const turnValidator = v.object({
  index: v.number(),
  role: voiceRoleValidator,
  text: v.string(),
  at: v.number(),
})

export const agentEventValidator = v.union(
  v.object({
    type: v.literal("turn"),
    roomName: v.string(),
    index: v.number(),
    role: voiceRoleValidator,
    text: v.string(),
    at: v.number(),
  }),
  v.object({
    type: v.literal("end"),
    roomName: v.string(),
    reason: v.string(),
    at: v.number(),
    turns: v.array(turnValidator),
  }),
)

export const voiceConnectionValidator = v.object({
  serverUrl: v.string(),
  participantToken: v.string(),
  roomName: v.string(),
  interviewId: v.id("interviews"),
})

export type Turn = Infer<typeof turnValidator>
export type AgentEvent = Infer<typeof agentEventValidator>
export type VoiceConnection = Infer<typeof voiceConnectionValidator>

export interface LiveKitKeys {
  url: string
  apiKey: string
  apiSecret: string
}

type Env = Readonly<Record<string, string | undefined>>

function envValue(env: Env, name: string): string {
  return env[name]?.trim() ?? ""
}

export function isVoiceEnabled(env: Env): boolean {
  return VOICE_KEYS.every((name) => envValue(env, name).length > 0)
}

export function agentName(env: Env): string {
  const name = envValue(env, "AGENT_NAME")

  return name.length > 0 ? name : DEFAULT_AGENT_NAME
}

export function liveKitKeys(env: Env): LiveKitKeys {
  if (!isVoiceEnabled(env)) {
    throw new ConvexError(VOICE_NOT_SET_UP)
  }

  return {
    url: envValue(env, "LIVEKIT_URL"),
    apiKey: envValue(env, "LIVEKIT_API_KEY"),
    apiSecret: envValue(env, "LIVEKIT_API_SECRET"),
  }
}

export function cleanTurnText(text: string): string {
  return text.trim().slice(0, MAX_TURN_LENGTH)
}

export function cleanTypedMessage(text: string): string {
  const cleaned = text.trim()

  if (cleaned.length === 0) {
    throw new ConvexError("Write a message first.")
  }

  if (cleaned.length > MAX_TURN_LENGTH) {
    throw new ConvexError(`Keep the message under ${MAX_TURN_LENGTH} characters.`)
  }

  return cleaned
}

export function bearerSecret(header: string | null): string | null {
  const match = header === null ? null : /^Bearer\s+(\S+)\s*$/.exec(header)

  return match?.[1] ?? null
}

async function digest(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))
}

// The default runtime has no timingSafeEqual: hashing both sides keeps the compare constant-time.
export async function secretsMatch(given: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(given), digest(expected)])
  let difference = 0

  for (let i = 0; i < a.length; i += 1) {
    difference |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }

  return difference === 0
}

export async function isAgentRequest(
  authorization: string | null,
  expected: string | undefined,
): Promise<boolean> {
  const secret = expected?.trim() ?? ""
  const given = bearerSecret(authorization)

  if (secret.length === 0 || given === null) {
    return false
  }

  return await secretsMatch(given, secret)
}
