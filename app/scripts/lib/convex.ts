import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { parseEnv } from "node:util"

export const APP_DIR = fileURLToPath(new URL("../..", import.meta.url))

const ENV_LOCAL = new URL("../../.env.local", import.meta.url)

export const DEPLOYMENT_OPTIONS = {
  prod: { type: "boolean", default: false },
  deployment: { type: "string" },
} as const

export interface DeploymentChoice {
  prod: boolean
  deployment?: string
}

export function deploymentFlags(choice: DeploymentChoice): string[] {
  if (choice.prod && choice.deployment !== undefined) {
    throw new Error("Choose the deployment with --prod or --deployment <name>, not both.")
  }

  if (choice.prod) {
    return ["--prod"]
  }

  return choice.deployment !== undefined ? ["--deployment", choice.deployment] : []
}

export function convexRun(functionName: string, args: object, choice: DeploymentChoice): unknown {
  const output = execFileSync(
    "npx",
    ["convex", "run", ...deploymentFlags(choice), functionName, JSON.stringify(args)],
    {
      cwd: APP_DIR,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  ).trim()

  return output.length > 0 ? JSON.parse(output) : null
}

export function readEnvLocal(): Record<string, string | undefined> {
  if (!existsSync(ENV_LOCAL)) {
    throw new Error("app/.env.local is missing: run `npx convex dev` once to write it.")
  }

  return parseEnv(readFileSync(ENV_LOCAL, "utf8"))
}

export function readConvexUrl(): string {
  const url = readEnvLocal().VITE_CONVEX_URL

  if (!url) {
    throw new Error("VITE_CONVEX_URL is missing from .env.local")
  }

  return url
}

export function errorText(error: unknown): string {
  const isExecError =
    typeof error === "object" && error !== null && "stderr" in error && error.stderr

  if (isExecError) {
    return String(error.stderr).trim()
  }

  return error instanceof Error ? error.message : String(error)
}
