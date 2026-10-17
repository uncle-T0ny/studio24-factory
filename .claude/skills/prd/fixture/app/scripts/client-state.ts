import { existsSync, writeFileSync } from "node:fs"
import { parseArgs } from "node:util"

// The skill test's stand-in for the real script while it is not on this branch: same arguments,
// writes state.json, never calls Convex.

const STAGES = ["interview", "prd", "analysis", "prototype", "feedback", "final"]
const { values } = parseArgs({
  options: {
    slug: { type: "string", default: "" },
    stage: { type: "string", default: "" },
    "dry-run": { type: "boolean", default: false },
  },
})
const folder = ["clients-private", "clients"]
  .map((parent) => `${parent}/${values.slug}`)
  .find((candidate) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug) && existsSync(candidate))
if (!folder || !STAGES.includes(values.stage)) {
  console.error(`usage: --slug <slug> --stage <${STAGES.join("|")}> [--dry-run]`)
  process.exit(1)
}
const state = { stage: values.stage, updatedAt: new Date().toISOString() }
writeFileSync(`${folder}/state.json`, `${JSON.stringify(state, null, 2)}\n`)
console.log(`${values.slug} is at ${values.stage}: ${folder}/state.json (dry run)`)
