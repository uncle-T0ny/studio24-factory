import { defineConfig } from "vitest/config"

// Unit tests for the worker's pure parts; nothing here starts LiveKit.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
})
