import { existsSync } from "node:fs"
import path from "node:path"

const STAGES = ["interview", "prd", "analysis", "prototype", "feedback", "final"] as const
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

type Stage = (typeof STAGES)[number]

export function parseStage(value: string): Stage {
  const stage = STAGES.find((candidate) => candidate === value)

  if (!stage) {
    throw new Error(`--stage must be one of: ${STAGES.join(", ")}.`)
  }

  return stage
}

export function clientFolder(repoDir: string, slug: string): string {
  if (!SLUG.test(slug)) {
    throw new Error("--slug must be lowercase words joined by hyphens, like demo-client.")
  }

  const folder = ["clients-private", "clients"]
    .map((parent) => path.join(repoDir, parent, slug))
    .find((candidate) => existsSync(candidate))

  if (!folder) {
    throw new Error(`No folder for ${slug} in clients-private/ or clients/.`)
  }

  return folder
}
