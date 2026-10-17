// `npm start` at the repo root: the whole app on this machine, with no Convex account and no
// keys. Plain Node (22.6+, run with type stripping), no dependency of its own, the same on
// macOS, Linux and Windows. Each run is idempotent:
//   1. checks Node, and installs app/ (and agent/, when voice is on) if node_modules is missing;
//   2. reads the settings: the environment first, then the root .env.local; generates the demo
//      owner's password and a local VOICE_AGENT_SECRET once, into .env.local;
//   3. starts `convex dev` on a local anonymous deployment (made once, then reused);
//   4. sets the deployment's env through stdin: the Convex Auth keys (made here once), SITE_URL,
//      OWNER_EMAILS, the demo owner, AGENT_NAME and every optional key found (removing the gone);
//   5. runs the seed (convex/seed.ts: the demo owner, then the app's own hook);
//   6. starts Vite and, when the five voice keys are set, the voice agent;
//   7. prints the URL and the sign-in.
// `npm run start:check` does the same, proves the app answers and the seed is there, and stops
// (CI). `npm run reset` deletes the local deployment's data.
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import {
  assertLocalDeployment,
  deploymentUrls,
  FUNCTIONS_READY,
  PUSH_FAILED,
  runFunction,
  startConvexDev,
  syncEnv,
} from "./start/deployment.ts"
import {
  answers,
  runVisible,
  start,
  stop,
  waitForLine,
  waitForUrl,
  type Started,
} from "./start/processes.ts"
import {
  AGENT_DIR,
  agentName,
  agentOnly,
  APP_DIR,
  APP_PORT,
  APP_URL,
  authKeys,
  CONVEX_ENV_FILE,
  demoEmail,
  isVoiceEnabled,
  loadSettings,
  OPTIONAL_KEYS,
  ownerEmails,
  pick,
  VOICE_KEYS,
  type Settings,
} from "./start/settings.ts"

const MIN_NODE = { major: 22, minor: 6 }
const CONVEX_READY_MS = 300_000
const APP_READY_MS = 60_000
const AGENT_READY_MS = 90_000
const AGENT_REGISTERED = /registered worker/
const VITE_BIN = path.join(APP_DIR, "node_modules", "vite", "bin", "vite.js")
const AGENT_MAIN = path.join("src", "main.ts")
const STRIP_TYPES = ["--experimental-strip-types", "--disable-warning=ExperimentalWarning"]
const CONVEX_OWNED_LINES = /^(#.*npx convex dev.*|CONVEX_DEPLOYMENT=.*|VITE_CONVEX_(SITE_)?URL=.*)$/

const startedAt = Date.now()
const running: Started[] = []
let isStopping = false

function say(text: string): void {
  console.log(`[start] ${text}`)
}

function elapsed(): string {
  return `${((Date.now() - startedAt) / 1000).toFixed(1)} s`
}

function checkNode(): void {
  const [major = 0, minor = 0] = process.versions.node.split(".").map(Number)
  const isNewEnough =
    major > MIN_NODE.major || (major === MIN_NODE.major && minor >= MIN_NODE.minor)

  if (!isNewEnough) {
    throw new Error(
      `Node ${String(MIN_NODE.major)}.${String(MIN_NODE.minor)} or later is needed; this is ${process.version}.`,
    )
  }
}

// The npm that runs this script (npm 10 or 11 alike), as `node npm-cli.js`; plain `npm` if not.
function npm(args: string[]): [string, string[], boolean] {
  const cli = process.env.npm_execpath ?? ""

  if (/\.c?js$/.test(cli)) {
    return [process.execPath, [cli, ...args], false]
  }

  return ["npm", args, process.platform === "win32"]
}

async function installIfMissing(dir: string): Promise<void> {
  if (existsSync(path.join(dir, "node_modules"))) {
    return
  }

  say(`installing ${path.basename(dir)}/ (npm ci), once`)

  const [command, args, shell] = npm(["ci", "--no-audit", "--no-fund"])

  await runVisible(command, args, dir, shell)
}

async function stopAll(): Promise<void> {
  if (isStopping) {
    return
  }

  isStopping = true
  await Promise.all(running.reverse().map(stop))
}

function exitOnSignal(): void {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      say("stopping")
      void stopAll().then(() => process.exit(0))
    })
  }
}

function track(started: Started): Started {
  running.push(started)
  void started.exited.then((code) => {
    if (!isStopping) {
      console.error(`[start] ${started.name} stopped (exit ${String(code)}); stopping the rest.`)
      void stopAll().then(() => process.exit(1))
    }
  })

  return started
}

async function provision(settings: Settings): Promise<void> {
  const desired: Record<string, string> = {
    ...pick(settings, OPTIONAL_KEYS),
    SITE_URL: APP_URL,
    OWNER_EMAILS: ownerEmails(settings),
    DEMO_OWNER_EMAIL: demoEmail(settings),
    DEMO_OWNER_PASSWORD: settings.values.DEMO_OWNER_PASSWORD ?? "",
    VOICE_AGENT_SECRET: settings.values.VOICE_AGENT_SECRET ?? "",
    AGENT_NAME: agentName(settings),
  }
  const changes = await syncEnv(desired, OPTIONAL_KEYS, {
    names: ["JWT_PRIVATE_KEY", "JWKS"],
    make: authKeys,
  })

  say(
    changes.set.length === 0 && changes.removed.length === 0
      ? "the deployment's env is up to date"
      : `the deployment's env: set ${changes.set.join(", ") || "nothing"}; removed ${changes.removed.join(", ") || "nothing"}`,
  )

  const seeded = (await runFunction("seed:run")) as { created?: boolean } | null

  say(seeded?.created === true ? "seeded the demo owner" : "the demo owner is already there")
}

function startAgent(settings: Settings, siteUrl: string): Started {
  return track(
    start("agent", process.execPath, [...STRIP_TYPES, AGENT_MAIN, "dev", "--log-level", "info"], {
      cwd: AGENT_DIR,
      env: {
        ...process.env,
        ...pick(settings, [...VOICE_KEYS, "OPENROUTER_MODEL"]),
        ...agentOnly(settings),
        AGENT_NAME: agentName(settings),
        CONVEX_SITE_URL: siteUrl,
        VOICE_AGENT_SECRET: settings.values.VOICE_AGENT_SECRET ?? "",
      },
    }),
  )
}

function printSummary(settings: Settings, isCheck: boolean): void {
  // Printed only to your own terminal; a CI log gets the file's name instead.
  const password = isCheck
    ? "DEMO_OWNER_PASSWORD in .env.local"
    : `${settings.values.DEMO_OWNER_PASSWORD ?? ""}   (saved in .env.local)`
  const voice = isVoiceEnabled(settings)
    ? `on, agent "${agentName(settings)}"`
    : `off (set ${VOICE_KEYS.join(", ")} in .env.local to turn it on)`

  console.log(
    [
      "",
      `  Ready in ${elapsed()}.`,
      `  App:       ${APP_URL}`,
      `  Sign in:   ${demoEmail(settings)}`,
      `  Password:  ${password}`,
      `  Voice:     ${voice}`,
      "  Stop with Ctrl+C. Start again with npm start; npm run reset deletes the local data.",
      "",
    ].join("\n"),
  )
}

async function verify(settings: Settings): Promise<void> {
  const owner = (await runFunction("seed:owner")) as { email?: string } | null

  if (owner?.email !== demoEmail(settings)) {
    throw new Error(`seed:owner returned ${JSON.stringify(owner)}, not the demo owner.`)
  }

  const isOn = await runFunction("voice:enabled")

  say(
    `check passed: ${APP_URL} answers 200, seed:owner is ${owner.email}, voice:enabled is ${String(isOn)}`,
  )
}

async function startAll(isCheck: boolean): Promise<void> {
  checkNode()
  assertLocalDeployment()
  await installIfMissing(APP_DIR)

  const settings = loadSettings()
  const isVoiceOn = isVoiceEnabled(settings)

  if (settings.generated.length > 0) {
    say(`generated ${settings.generated.join(", ")} into .env.local`)
  }

  if (isVoiceOn) {
    await installIfMissing(AGENT_DIR)
  }

  exitOnSignal()
  say("starting the local Convex backend (the first run downloads it)")

  const convex = track(startConvexDev())

  await waitForLine(convex, FUNCTIONS_READY, CONVEX_READY_MS, PUSH_FAILED)
  await provision(settings)

  const { cloudUrl, siteUrl } = deploymentUrls()

  if (await answers(APP_URL)) {
    throw new Error(`Something already answers on ${APP_URL}; stop it first.`)
  }

  track(
    start("vite", process.execPath, [VITE_BIN, "--port", String(APP_PORT), "--strictPort"], {
      cwd: APP_DIR,
      env: { ...process.env, VITE_CONVEX_URL: cloudUrl },
    }),
  )
  await waitForUrl(APP_URL, APP_READY_MS)

  if (isVoiceOn) {
    const agent = startAgent(settings, siteUrl)

    await waitForLine(agent, AGENT_REGISTERED, AGENT_READY_MS)
    say(`the voice agent registered with LiveKit as "${agentName(settings)}"`)
  }

  printSummary(settings, isCheck)

  if (isCheck) {
    await verify(settings)
    await stopAll()
    process.exit(0)
  }
}

// Deletes the local deployment (its data in app/.convex/ and its lines in app/.env.local). The
// root .env.local, with the demo password and your keys, stays.
async function reset(): Promise<void> {
  const url = existsSync(CONVEX_ENV_FILE) ? deploymentUrls().cloudUrl : null

  if (url !== null && (await answers(`${url}/version`))) {
    throw new Error("The local backend is running: stop npm start first.")
  }

  rmSync(path.join(APP_DIR, ".convex"), { recursive: true, force: true })

  if (existsSync(CONVEX_ENV_FILE)) {
    const kept = readFileSync(CONVEX_ENV_FILE, "utf8")
      .split(/\r?\n/)
      .filter((line) => !CONVEX_OWNED_LINES.test(line))

    writeFileSync(CONVEX_ENV_FILE, kept.join("\n").trim() + "\n")
  }

  say("the local deployment is gone; npm start makes a new one")
}

const { values: flags } = parseArgs({
  options: {
    check: { type: "boolean", default: false },
    reset: { type: "boolean", default: false },
  },
})

const main = flags.reset ? reset() : startAll(flags.check)

main.catch(async (error: unknown) => {
  console.error(`[start] ${error instanceof Error ? error.message : String(error)}`)
  await stopAll()
  process.exit(1)
})
