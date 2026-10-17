// The e2e suite runs its own local Convex backend and Vite server on ports picked to stay clear
// of a dev server on 5173 and a `convex dev` local backend on its default ports.
// E2E_BACKEND_PORT, E2E_SITE_PORT and E2E_VITE_PORT move them, so two checkouts can run side by side.
const DEFAULT_BACKEND_PORT = 3290
const DEFAULT_SITE_PORT = 3291
const DEFAULT_VITE_PORT = 5288
const MAX_PORT = 65535

function portFromEnv(name: string, fallback: number): number {
  const value = process.env[name]?.trim() ?? ""

  if (value.length === 0) {
    return fallback
  }

  const port = Number(value)
  const isPort = Number.isInteger(port) && port > 0 && port <= MAX_PORT

  if (!isPort) {
    throw new Error(`${name} must be a port number, not "${value}".`)
  }

  return port
}

export const CONVEX_CLOUD_PORT = portFromEnv("E2E_BACKEND_PORT", DEFAULT_BACKEND_PORT)
export const CONVEX_SITE_PORT = portFromEnv("E2E_SITE_PORT", DEFAULT_SITE_PORT)
export const APP_PORT = portFromEnv("E2E_VITE_PORT", DEFAULT_VITE_PORT)

export const CONVEX_URL = `http://127.0.0.1:${CONVEX_CLOUD_PORT}`
export const APP_URL = `http://127.0.0.1:${APP_PORT}`
