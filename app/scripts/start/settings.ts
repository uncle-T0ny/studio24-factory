import { generateKeyPairSync, randomBytes } from "node:crypto"
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseEnv } from "node:util"

// What `npm start` reads and generates. The reviewer's settings live in the repo root's
// .env.local (gitignored), never in a shell export: a name set in the environment wins over the
// file, and the file wins over a default. Generated values (the demo owner's password, the
// local voice secret) are written to the file once and reused. A key that came from the
// environment is never written anywhere.

export const ROOT_DIR = fileURLToPath(new URL("../../..", import.meta.url))
export const APP_DIR = path.join(ROOT_DIR, "app")
export const AGENT_DIR = path.join(ROOT_DIR, "agent")
export const SETTINGS_FILE = path.join(ROOT_DIR, ".env.local")
// Written by the Convex CLI: which deployment `convex dev` uses, and its URLs.
export const CONVEX_ENV_FILE = path.join(APP_DIR, ".env.local")

export const APP_PORT = 5173
export const APP_URL = `http://localhost:${String(APP_PORT)}`
export const DEFAULT_DEMO_EMAIL = "demo@example.com"
export const DEFAULT_AGENT_NAME = "voice-assistant"

// Voice is on only when all five are set (app/convex/lib/voice.ts has the same list).
export const VOICE_KEYS = [
  "LIVEKIT_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "DEEPGRAM_API_KEY",
  "OPENROUTER_API_KEY",
] as const

// The optional keys `npm start` pushes to the local deployment when it finds them, and removes
// from it when they are gone, so the deployment always matches .env.local. Add your app's own
// optional keys here.
export const OPTIONAL_KEYS = [
  ...VOICE_KEYS,
  "OPENROUTER_MODEL",
  "VOICE_SESSIONS_PER_DAY",
  "AUTH_RESEND_KEY",
  "AUTH_EMAIL_FROM",
] as const

// The agent's own settings, passed to it but not to the deployment.
const AGENT_ONLY_KEYS = ["VOICE_MAX_SECONDS"] as const

const GENERATED = {
  DEMO_OWNER_PASSWORD: () => randomBytes(12).toString("base64url"),
  VOICE_AGENT_SECRET: () => randomBytes(32).toString("base64url"),
} as const

// Partial: a name may be missing (this tsconfig has no noUncheckedIndexedAccess).
type Values = Partial<Record<string, string>>

export interface Settings {
  // Every value found, generated ones included.
  values: Values
  // Names whose value came from the environment, not the file.
  fromEnvironment: Set<string>
  // Names generated on this run and saved to SETTINGS_FILE.
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

// OWNER_EMAILS as set, with the demo owner's email added: the allowlist must let her in.
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

// Convex Auth's signing keys, made here as its manual setup does: an RS256 key pair, the private
// key as PKCS#8 PEM on one line, the public one as a JWKS.
export function authKeys(): Record<string, string> {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString()

  return {
    JWT_PRIVATE_KEY: pem.trimEnd().replace(/\n/g, " "),
    JWKS: JSON.stringify({ keys: [{ use: "sig", ...publicKey.export({ format: "jwk" }) }] }),
  }
}

// One .env line for the Convex CLI's stdin, quoted with a quote the value doesn't contain.
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
