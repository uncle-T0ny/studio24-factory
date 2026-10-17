import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { parseArgs } from "node:util"

// The test stand-in for the real script: same arguments, writes state.json, never calls Convex.

const STAGES = ["interview", "prd", "analysis", "prototype", "feedback", "final"]
const { values } = parseArgs({
  options: {
    slug: { type: "string" },
    stage: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
})
const folder = ["clients-private", "clients"]
  .map((root) => `${root}/${values.slug ?? ""}`)
  .find((candidate) => values.slug && existsSync(candidate))
if (!folder || !values.stage || !STAGES.includes(values.stage)) {
  console.error(`usage: --slug <slug> --stage <${STAGES.join("|")}> [--dry-run]`)
  process.exit(1)
}
const statePath = `${folder}/state.json`
const state: Record<string, unknown> = existsSync(statePath)
  ? (JSON.parse(readFileSync(statePath, "utf8")) as Record<string, unknown>)
  : {}
writeFileSync(statePath, `${JSON.stringify({ ...state, stage: values.stage }, null, 2)}\n`)
console.log(`${statePath}: stage ${values.stage} (dry run, Convex not called)`)
