import { execFileSync } from "node:child_process"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const UNKNOWN_VERSION = "unknown"

function gitShortCommit(): string {
  try {
    const commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()

    return commit.length > 0 ? commit : UNKNOWN_VERSION
  } catch {
    return UNKNOWN_VERSION
  }
}

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
  },
  define: {
    __APP_VERSION__: JSON.stringify(gitShortCommit()),
  },
  test: {
    include: ["src/**/*.test.ts", "convex/**/*.test.ts"],
    environment: "node",
  },
})
