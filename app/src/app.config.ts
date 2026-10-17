// The client's app settings. The brand and the app's name come from convex/lib/appConfig.ts, the
// one source for the server (emails, backups) and the client (page headers).
export { APP_NAME, BRAND } from "../convex/lib/appConfig"

// The optional voice module (README, "Optional: voice (LiveKit)") is on when the Convex
// deployment has its keys: the project pages ask voice.enabled (src/projects/ProjectAssistant.tsx).

// How long the voice card waits for the agent to join before it offers the typed fallback. An
// agent on LiveKit Cloud's free plan can take 10-20 s to start after it was idle.
export const VOICE_AGENT_JOIN_TIMEOUT_MS = 30_000
