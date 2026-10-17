import { writeFileSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { clientFolder, parseStage } from "./lib/clients.ts"
import { APP_DIR, convexRun, DEPLOYMENT_OPTIONS, deploymentFlags, errorText } from "./lib/convex.ts"

// `npx convex run` acts under the developer's own Convex login, so no deploy key sits in the repo.
// Convex first: state.json only mirrors a stage that Convex accepted.

const SET_STAGE = "projects:setStage"

const { values } = parseArgs({
  options: {
    ...DEPLOYMENT_OPTIONS,
    slug: { type: "string", default: "" },
    stage: { type: "string", default: "" },
    "dry-run": { type: "boolean", default: false },
  },
})

try {
  const folder = clientFolder(path.join(APP_DIR, ".."), values.slug)
  const stage = parseStage(values.stage)
  const args = { slug: values.slug, stage }

  if (values["dry-run"]) {
    const command = [
      "npx convex run",
      ...deploymentFlags(values),
      SET_STAGE,
      `'${JSON.stringify(args)}'`,
    ]
    console.log(`Dry run, not run (in app/): ${command.join(" ")}`)
  } else {
    convexRun(SET_STAGE, args, values)
  }

  const state = { stage, updatedAt: new Date().toISOString() }
  writeFileSync(path.join(folder, "state.json"), `${JSON.stringify(state, null, 2)}\n`)
  console.log(`${values.slug} is at ${stage}: ${path.relative(process.cwd(), folder)}/state.json`)
} catch (error) {
  console.error(errorText(error))
  process.exit(1)
}
