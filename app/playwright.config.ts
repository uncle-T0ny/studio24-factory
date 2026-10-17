import { defineConfig, devices } from "@playwright/test"
import { assertLocalDeployment } from "./e2e/support/localDeployment"
import { APP_PORT, APP_URL, CONVEX_URL } from "./e2e/support/ports"

// Never let the suite reach the shared dev or the prod deployment.
assertLocalDeployment()

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "test-results",
  fullyParallel: true,
  workers: 4,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"]],
  use: {
    baseURL: APP_URL,
    viewport: {
      width: 1440,
      height: 900,
    },
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: {
          width: 1440,
          height: 900,
        },
      },
    },
  ],
  webServer: [
    {
      name: "convex",
      command: "npx tsx e2e/localBackend.ts",
      wait: {
        stdout: /E2E backend ready/,
      },
      timeout: 180_000,
      gracefulShutdown: {
        signal: "SIGTERM",
        timeout: 10_000,
      },
    },
    {
      name: "vite",
      command: `npx vite --port ${APP_PORT} --strictPort --host 127.0.0.1`,
      url: APP_URL,
      env: {
        VITE_CONVEX_URL: CONVEX_URL,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
