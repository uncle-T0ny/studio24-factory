import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { APP_DIR, DEPLOYMENT_OPTIONS, deploymentFlags } from "./lib/convex"

const BACKUPS_DIR = path.join(APP_DIR, "backups")

function localDate(): string {
  return new Date().toLocaleDateString("en-CA")
}

function freeBackupPath(date: string): string {
  let candidate = path.join(BACKUPS_DIR, `${date}.zip`)

  for (let copy = 2; existsSync(candidate); copy += 1) {
    candidate = path.join(BACKUPS_DIR, `${date}-${copy}.zip`)
  }

  return candidate
}

// The arguments choose the deployment: `--prod`, `--deployment <name>`, or none for .env.local.
const { values } = parseArgs({ options: DEPLOYMENT_OPTIONS })
const zipPath = freeBackupPath(localDate())

mkdirSync(BACKUPS_DIR, { recursive: true })
execFileSync(
  "npx",
  ["convex", "export", ...deploymentFlags(values), "--include-file-storage", "--path", zipPath],
  {
    cwd: APP_DIR,
    stdio: "inherit",
  },
)
console.log(`Backup written to ${zipPath}`)
