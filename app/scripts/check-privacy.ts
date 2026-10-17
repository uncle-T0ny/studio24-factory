import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { findPrivateData, parseDenyList } from "./lib/privacy"

// The deny list stays in clients-private/, never in the repo; findings print where, never the value,
// so a CI log can't leak it either.

const REPO_DIR = fileURLToPath(new URL("../..", import.meta.url))
const CLIENTS_DIR = path.join(REPO_DIR, "clients")
const DENY_LIST = path.join(REPO_DIR, "clients-private", "deny-list.txt")

function clientFiles(): string[] {
  if (!existsSync(CLIENTS_DIR)) {
    return []
  }

  return readdirSync(CLIENTS_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(REPO_DIR, path.join(entry.parentPath, entry.name)))
}

function readDeniedNames(): string[] {
  if (!existsSync(DENY_LIST)) {
    console.log("No clients-private/deny-list.txt: checking for email addresses only.")
    return []
  }

  return parseDenyList(readFileSync(DENY_LIST, "utf8"))
}

const deniedNames = readDeniedNames()
const findings = clientFiles().flatMap((file) => [
  ...findPrivateData(file, deniedNames).map((finding) => `${file}: ${finding.kind} in the path`),
  ...findPrivateData(readFileSync(path.join(REPO_DIR, file), "utf8"), deniedNames).map(
    (finding) => `${file}:${finding.line}: ${finding.kind}`,
  ),
])

if (findings.length > 0) {
  console.error(`Privacy: ${findings.length} finding(s) under clients/, the public repo.`)
  console.error(findings.join("\n"))
  process.exit(1)
}
