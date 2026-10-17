import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// English only: fails on any Cyrillic letter in the code, comments included, which ESLint can't
// see. `npm run check:english`. Written in Node because macOS grep has no -P.

const APP_DIR = fileURLToPath(new URL("..", import.meta.url))
const SOURCE_DIRS = ["src", "convex", "scripts", "e2e"]
const EXTENSIONS = new Set([".ts", ".tsx", ".css"])
const CYRILLIC = /[\u0400-\u04FF]/

function sourceFiles(dir: string): string[] {
  return readdirSync(path.join(APP_DIR, dir), { recursive: true, encoding: "utf8" })
    .filter((file) => EXTENSIONS.has(path.extname(file)))
    .map((file) => path.join(dir, file))
}

const matches = SOURCE_DIRS.flatMap(sourceFiles).flatMap((file) =>
  readFileSync(path.join(APP_DIR, file), "utf8")
    .split("\n")
    .flatMap((line, index) =>
      CYRILLIC.test(line) ? [`${file}:${index + 1}: ${line.trim()}`] : [],
    ),
)

if (matches.length > 0) {
  console.error(`English only: ${matches.length} line(s) with Cyrillic letters.`)
  console.error(matches.join("\n"))
  process.exit(1)
}
