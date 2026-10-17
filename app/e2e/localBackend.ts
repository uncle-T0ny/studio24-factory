// Starts (or reuses) the e2e suite's own local anonymous Convex backend, pushes the functions,
// sets the auth environment, then prints READY_LINE and stays up until it gets SIGTERM/SIGINT.
// Playwright runs it as a webServer; run it by hand with `npm run e2e:backend`. The Convex CLI
// runs in app/.e2e/ (E2E_DIR), so it never writes app/.env.local.
import { execFileSync, spawn } from "node:child_process"
import {
  assertLocalDeployment,
  E2E_DIR,
  localConvexEnv,
  prepareE2eDir,
  runConvex,
} from "./support/localDeployment"
import { ALLOWLISTED_OWNER_EMAIL } from "./support/owners"
import { APP_URL, CONVEX_CLOUD_PORT, CONVEX_SITE_PORT, CONVEX_URL } from "./support/ports"

const READY_LINE = "E2E backend ready"
const FUNCTIONS_READY = /Convex functions ready/
const AUTH_KEYS = ["JWT_PRIVATE_KEY", "JWKS"]
const BACKEND_ENV: Record<string, string> = {
  SITE_URL: APP_URL,
  OWNER_EMAILS: ALLOWLISTED_OWNER_EMAIL,
  ALLOW_TEST_FUNCTIONS: "true",
}

function log(message: string): void {
  console.log(`[e2e backend] ${message}`)
}

function deploymentEnvNames(): Map<string, string> {
  const values = new Map<string, string>()

  for (const line of runConvex(["env", "list"]).split("\n")) {
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line)

    if (match) {
      values.set(match[1], match[2])
    }
  }

  return values
}

function ensureBackendEnv(): void {
  const current = deploymentEnvNames()
  const hasAuthKeys = AUTH_KEYS.every((name) => current.has(name))

  if (!hasAuthKeys) {
    log("setting the Convex Auth keys with npx @convex-dev/auth")
    execFileSync("npx", ["@convex-dev/auth", "--web-server-url", APP_URL, "--skip-git-check"], {
      cwd: E2E_DIR,
      env: localConvexEnv(),
      stdio: ["ignore", "ignore", "inherit"],
    })
  }

  for (const [name, value] of Object.entries(BACKEND_ENV)) {
    if (current.get(name) !== value) {
      log(`setting ${name}`)
      runConvex(["env", "set", name, value])
    }
  }
}

async function isBackendUp(): Promise<boolean> {
  try {
    const response = await fetch(`${CONVEX_URL}/version`)

    return response.ok
  } catch {
    return false
  }
}

function stayUp(): void {
  const timer = setInterval(() => undefined, 60_000)
  const stop = () => {
    clearInterval(timer)
    process.exit(0)
  }

  process.on("SIGTERM", stop)
  process.on("SIGINT", stop)
}

function startConvexDev(): void {
  const child = spawn(
    "npx",
    [
      "convex",
      "dev",
      "--local-cloud-port",
      String(CONVEX_CLOUD_PORT),
      "--local-site-port",
      String(CONVEX_SITE_PORT),
      "--tail-logs",
      "disable",
    ],
    {
      cwd: E2E_DIR,
      env: localConvexEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    },
  )
  let isReady = false

  const watch = (chunk: Buffer, write: (text: string) => void) => {
    const text = chunk.toString()

    write(text)

    if (isReady || !FUNCTIONS_READY.test(text)) {
      return
    }

    isReady = true

    try {
      assertLocalDeployment(true)
      ensureBackendEnv()
      console.log(READY_LINE)
    } catch (error) {
      console.error(error)
      child.kill("SIGTERM")
      process.exitCode = 1
    }
  }

  child.stdout.on("data", (chunk: Buffer) => watch(chunk, (text) => process.stdout.write(text)))
  child.stderr.on("data", (chunk: Buffer) => watch(chunk, (text) => process.stderr.write(text)))
  child.on("exit", (code) => process.exit(process.exitCode ?? code ?? 0))

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => child.kill(signal))
  }
}

async function main(): Promise<void> {
  assertLocalDeployment()
  prepareE2eDir()

  if (await isBackendUp()) {
    // A backend already answers on our port: it must be this worktree's own (runConvex checks
    // app/.e2e/.env.local, and the admin key only works on our deployment). Its convex dev keeps the
    // functions in sync, so only the environment is checked here.
    log(`reusing the local backend at ${CONVEX_URL}`)
    ensureBackendEnv()
    console.log(READY_LINE)
    stayUp()

    return
  }

  log(`starting a local backend at ${CONVEX_URL}`)
  startConvexDev()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
