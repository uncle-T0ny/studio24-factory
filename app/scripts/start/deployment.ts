import path from "node:path"
import { parseEnv } from "node:util"
import { run, start, type Started } from "./processes.ts"
import { APP_DIR, envLine, readConvexEnvFile } from "./settings.ts"

// The local Convex deployment, through the app's own Convex CLI run as `node <its script>`.
// CONVEX_AGENT_MODE=anonymous makes the CLI use a local anonymous deployment even in an
// interactive terminal and even when you are logged in to Convex (convex 1.47,
// cli/lib/deploymentSelection.js: no login prompt, no cloud project). The deployment's state
// lives in app/.convex/ and app/.env.local names it, so a re-run reuses it.

const CONVEX_BIN = path.join(APP_DIR, "node_modules", "convex", "bin", "main.js")
const LOCAL_DEPLOYMENT = /^(anonymous|local):/
// Shell variables that would choose another deployment; never passed to the CLI.
const DEPLOYMENT_ENV_NAMES = new Set([
  "CONVEX_DEPLOYMENT",
  "CONVEX_DEPLOY_KEY",
  "CONVEX_SELF_HOSTED_URL",
  "CONVEX_SELF_HOSTED_ADMIN_KEY",
  "CONVEX_URL",
  "VITE_CONVEX_URL",
])

export const FUNCTIONS_READY = /Convex functions ready/
// The first push failed (a type error, a bad schema): convex dev would wait for a fix.
export const PUSH_FAILED = /Found \d+ errors? in|✖/

function convexEnv(): NodeJS.ProcessEnv {
  const inherited = Object.entries(process.env).filter(([name]) => !DEPLOYMENT_ENV_NAMES.has(name))

  return { ...Object.fromEntries(inherited), CONVEX_AGENT_MODE: "anonymous" }
}

function convex(args: string[], input?: string): Promise<string> {
  return run(process.execPath, [CONVEX_BIN, ...args], { cwd: APP_DIR, env: convexEnv(), input })
}

// npm start never touches a cloud deployment: it refuses when app/.env.local names one.
export function assertLocalDeployment(): void {
  const deployment = readConvexEnvFile().CONVEX_DEPLOYMENT

  if (deployment !== undefined && !LOCAL_DEPLOYMENT.test(deployment)) {
    throw new Error(
      `app/.env.local points at ${deployment}, a cloud deployment. npm start runs only a local ` +
        "one: move app/.env.local away first, or use `npx convex dev` in app/ for that deployment.",
    )
  }
}

export function startConvexDev(): Started {
  return start("convex", process.execPath, [CONVEX_BIN, "dev", "--tail-logs", "always"], {
    cwd: APP_DIR,
    env: convexEnv(),
  })
}

export interface DeploymentUrls {
  cloudUrl: string
  siteUrl: string
}

export function deploymentUrls(): DeploymentUrls {
  const values = readConvexEnvFile()
  const cloudUrl = values.VITE_CONVEX_URL

  if (cloudUrl === undefined) {
    throw new Error("app/.env.local has no VITE_CONVEX_URL after convex dev started.")
  }

  const fallbackSite = new URL(cloudUrl)

  fallbackSite.port = String(Number(fallbackSite.port) + 1)

  return { cloudUrl, siteUrl: values.VITE_CONVEX_SITE_URL ?? fallbackSite.origin }
}

async function deploymentEnv(): Promise<Record<string, string | undefined>> {
  return parseEnv(await convex(["env", "list", "--include-values"]))
}

export interface EnvChanges {
  set: string[]
  removed: string[]
}

// Makes the deployment's env match: sets what differs (every value through stdin, none on a
// command line) and removes the managed names that have no value any more. The `once` values
// (the auth key pair) are made and set only when one of them is missing: a new pair on every
// run would sign everyone out.
export async function syncEnv(
  desired: Record<string, string>,
  managed: readonly string[],
  once: { names: readonly string[]; make: () => Record<string, string> },
): Promise<EnvChanges> {
  const current = await deploymentEnv()
  const changed = Object.entries(desired).filter(([name, value]) => current[name] !== value)
  const isMissing = once.names.some((name) => (current[name] ?? "").length === 0)
  const toSet = [...changed, ...(isMissing ? Object.entries(once.make()) : [])]
  const removed = managed.filter((name) => current[name] !== undefined && !(name in desired))

  if (toSet.length > 0) {
    await convex(
      ["env", "set", "--force"],
      toSet.map(([name, value]) => envLine(name, value)).join(""),
    )
  }

  for (const name of removed) {
    await convex(["env", "remove", name])
  }

  return { set: toSet.map(([name]) => name), removed }
}

export async function runFunction(name: string): Promise<unknown> {
  const output = (await convex(["run", name])).trim()

  return output.length === 0 ? null : (JSON.parse(output) as unknown)
}
