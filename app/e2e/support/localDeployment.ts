import { execFileSync } from "node:child_process"
import { existsSync, lstatSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseEnv } from "node:util"
import { CONVEX_URL } from "./ports"

export const APP_DIR = fileURLToPath(new URL("../..", import.meta.url))

export const E2E_DIR = path.join(APP_DIR, ".e2e")

const ENV_FILE = path.join(E2E_DIR, ".env.local")
const APP_ENV_FILE = path.join(APP_DIR, ".env.local")
const APP_CONVEX_JSON = path.join(APP_DIR, "convex.json")
const DEFAULT_FUNCTIONS_DIR = "convex"
const SHARED_DEPLOYMENTS_ENV = "E2E_SHARED_DEPLOYMENTS"
const LOCAL_DEPLOYMENT = /^(anonymous|local):/
const CLOUD_URL = /\.convex\.(cloud|site)\b/
const DEPLOYMENT_ENV_NAMES = [
  "CONVEX_DEPLOYMENT",
  "CONVEX_DEPLOY_KEY",
  "CONVEX_SELF_HOSTED_URL",
  "CONVEX_SELF_HOSTED_ADMIN_KEY",
  "CONVEX_URL",
  "VITE_CONVEX_URL",
]
const FOREIGN_DEPLOYMENT_NAMES = [
  "CONVEX_DEPLOY_KEY",
  "CONVEX_SELF_HOSTED_URL",
  "CONVEX_SELF_HOSTED_ADMIN_KEY",
]

function refuse(reason: string): never {
  throw new Error(
    `The e2e suite refuses to run: ${reason}. It must only use its own local anonymous Convex ` +
      "deployment in app/.e2e/ (made by e2e/localBackend.ts).",
  )
}

function deploymentName(deployment: string | undefined): string | null {
  if (deployment === undefined || LOCAL_DEPLOYMENT.test(deployment)) {
    return null
  }

  return deployment.replace(/^[a-z]+:/, "")
}

function sharedDeployments(): string[] {
  const fromEnv = (process.env[SHARED_DEPLOYMENTS_ENV] ?? "").split(",").map((name) => name.trim())
  const appDeployment = existsSync(APP_ENV_FILE)
    ? deploymentName(parseEnv(readFileSync(APP_ENV_FILE, "utf8")).CONVEX_DEPLOYMENT)
    : null

  return [...fromEnv, appDeployment ?? ""].filter((name) => name.length > 0)
}

export function assertLocalDeployment(requireUrl = false): void {
  if (!existsSync(ENV_FILE)) {
    if (requireUrl) {
      refuse("app/.e2e/.env.local is missing")
    }

    return
  }

  const text = readFileSync(ENV_FILE, "utf8")
  const values = parseEnv(text)
  const deployment = values.CONVEX_DEPLOYMENT
  const url = values.VITE_CONVEX_URL
  const sharedName = sharedDeployments().find((name) => text.includes(name))
  const foreignName = FOREIGN_DEPLOYMENT_NAMES.find((name) => values[name] !== undefined)

  if (sharedName) {
    refuse(`app/.e2e/.env.local names the shared deployment ${sharedName}`)
  }

  if (foreignName) {
    refuse(`app/.e2e/.env.local sets ${foreignName}`)
  }

  if (CLOUD_URL.test(text)) {
    refuse("app/.e2e/.env.local has a cloud deployment URL")
  }

  if (deployment !== undefined && !LOCAL_DEPLOYMENT.test(deployment)) {
    refuse(`app/.e2e/.env.local points at ${deployment}, not a local deployment`)
  }

  if (requireUrl && url !== CONVEX_URL) {
    refuse(`app/.e2e/.env.local has VITE_CONVEX_URL=${url ?? ""}, not ${CONVEX_URL}`)
  }
}

function linkFromApp(name: string): void {
  const link = path.join(E2E_DIR, name)

  if (!lstatSync(link, { throwIfNoEntry: false })) {
    symlinkSync(path.relative(E2E_DIR, path.join(APP_DIR, name)), link)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function prepareE2eDir(): void {
  const parsed: unknown = JSON.parse(readFileSync(APP_CONVEX_JSON, "utf8"))
  const appConfig: Record<string, unknown> = isRecord(parsed) ? parsed : {}
  const functions =
    typeof appConfig.functions === "string" ? appConfig.functions : DEFAULT_FUNCTIONS_DIR
  const config = {
    ...appConfig,
    functions: path.relative(E2E_DIR, path.join(APP_DIR, functions)),
  }

  mkdirSync(E2E_DIR, { recursive: true })
  writeFileSync(path.join(E2E_DIR, "convex.json"), `${JSON.stringify(config, null, 2)}\n`)
  linkFromApp("package.json")
  linkFromApp("node_modules")
}

export function localConvexEnv(): NodeJS.ProcessEnv {
  const deploymentNames: ReadonlySet<string> = new Set(DEPLOYMENT_ENV_NAMES)
  const inherited = Object.entries(process.env).filter(([name]) => !deploymentNames.has(name))

  return {
    ...Object.fromEntries(inherited),
    CONVEX_AGENT_MODE: "anonymous",
  }
}

export function runConvex(args: string[]): string {
  assertLocalDeployment(true)

  return execFileSync("npx", ["convex", ...args], {
    cwd: E2E_DIR,
    env: localConvexEnv(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
}
