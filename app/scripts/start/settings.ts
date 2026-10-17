import { generateKeyPairSync, randomBytes } from "node:crypto"
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseEnv } from "node:util"

export const ROOT_DIR = fileURLToPath(new URL("../../..", import.meta.url))
export const APP_DIR = path.join(ROOT_DIR, "app")
export const AGENT_DIR = path.join(ROOT_DIR, "agent")
export const SETTINGS_FILE = path.join(ROOT_DIR, ".env.local")
export const CONVEX_ENV_FILE = path.join(APP_DIR, ".env.local")

export const APP_PORT = 5173
export const APP_URL = `http://localhost:${String(APP_PORT)}`
export const DEFAULT_DEMO_EMAIL = "demo@example.com"
export const DEFAULT_AGENT_NAME = "voice-assistant"

export const VOICE_KEYS = [
  "LIVEKIT_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "DEEPGRAM_API_KEY",
  "OPENROUTER_API_KEY",
] as const

export const OPTIONAL_KEYS = [
  ...VOICE_KEYS,
  "OPENROUTER_MODEL",
  "VOICE_SESSIONS_PER_DAY",
  "AUTH_RESEND_KEY",
  "AUTH_EMAIL_FROM",
] as const

const AGENT_ONLY_KEYS = ["VOICE_MAX_SECONDS"] as const

const GENERATED = {
  DEMO_OWNER_PASSWORD: () => randomBytes(12).toString("base64url"),
  VOICE_AGENT_SECRET: () => randomBytes(32).toString("base64url"),
} as const

type Values = Partial<Record<string, string>>

export interface Settings {
  values: Values
  fromEnvironment: Set<string>
  generated: string[]
}

function readEnvFile(file: string): Values {
  if (!existsSync(file)) {
    return {}
  }

  const parsed = parseEnv(readFileSync(file, "utf8"))
  const values: Values = {}

  for (const [name, value] of Object.entries(parsed)) {
    if (typeof value === "string" && value.trim().length > 0) {
      values[name] = value.trim()
    }
  }

  return values
}

function knownNames(fileValues: Values): string[] {
  const names = new Set<string>([
    ...OPTIONAL_KEYS,
    ...AGENT_ONLY_KEYS,
    ...Object.keys(GENERATED),
    "OWNER_EMAILS",
    "DEMO_OWNER_EMAIL",
    "AGENT_NAME",
  ])

  for (const name of Object.keys(fileValues)) {
    names.add(name)
  }

  return [...names]
}

function appendToFile(file: string, values: Record<string, string>): void {
  const existing = existsSync(file) ? readFileSync(file, "utf8") : ""
  const separator = existing.length === 0 || existing.endsWith("\n") ? "" : "\n"
  const header = existing.length === 0 ? "# npm start's local settings (gitignored).\n" : ""
  const lines = Object.entries(values).map(([name, value]) => `${name}=${value}\n`)

  writeFileSync(file, existing + separator + header + lines.join(""))

  try {
    chmodSync(file, 0o600)
  } catch {
    // Windows keeps its own ACLs.
  }
}

export function loadSettings(): Settings {
  const fileValues = readEnvFile(SETTINGS_FILE)
  const values: Values = {}
  const fromEnvironment = new Set<string>()

  for (const name of knownNames(fileValues)) {
    const fromEnv = process.env[name]?.trim() ?? ""

    if (fromEnv.length > 0) {
      values[name] = fromEnv
      fromEnvironment.add(name)
    } else if (fileValues[name] !== undefined) {
      values[name] = fileValues[name]
    }
  }

  const fresh: Record<string, string> = {}

  for (const [name, generate] of Object.entries(GENERATED)) {
    if (values[name] === undefined) {
      const value = generate()

      fresh[name] = value
      values[name] = value
    }
  }

  if (Object.keys(fresh).length > 0) {
    appendToFile(SETTINGS_FILE, fresh)
  }

  return { values, fromEnvironment, generated: Object.keys(fresh) }
}

export function isVoiceEnabled(settings: Settings): boolean {
  return VOICE_KEYS.every((name) => settings.values[name] !== undefined)
}

export function demoEmail(settings: Settings): string {
  return (settings.values.DEMO_OWNER_EMAIL ?? DEFAULT_DEMO_EMAIL).toLowerCase()
}

export function agentName(settings: Settings): string {
  return settings.values.AGENT_NAME ?? DEFAULT_AGENT_NAME
}

export function ownerEmails(settings: Settings): string {
  const listed = (settings.values.OWNER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
  const demo = demoEmail(settings)

  return [...new Set([...listed, demo])].join(",")
}

export function pick(settings: Settings, names: readonly string[]): Record<string, string> {
  const picked: Record<string, string> = {}

  for (const name of names) {
    const value = settings.values[name]

    if (value !== undefined) {
      picked[name] = value
    }
  }

  return picked
}

export function agentOnly(settings: Settings): Record<string, string> {
  return pick(settings, AGENT_ONLY_KEYS)
}

export function authKeys(): Record<string, string> {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString()

  return {
    JWT_PRIVATE_KEY: pem.trimEnd().replace(/\n/g, " "),
    JWKS: JSON.stringify({ keys: [{ use: "sig", ...publicKey.export({ format: "jwk" }) }] }),
  }
}

export function envLine(name: string, value: string): string {
  if (/[\r\n]/.test(value)) {
    throw new Error(`${name} has a line break; set it by hand with npx convex env set.`)
  }

  const quote = ['"', "'", "`"].find((candidate) => !value.includes(candidate))

  if (quote === undefined) {
    throw new Error(`${name} has every kind of quote in it; set it by hand.`)
  }

  return `${name}=${quote}${value}${quote}\n`
}

export function readConvexEnvFile(): Values {
  return readEnvFile(CONVEX_ENV_FILE)
}
