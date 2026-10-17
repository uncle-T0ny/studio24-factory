import { describe, expect, it } from "vitest"
import {
  DEFAULT_AGENT_NAME,
  DEFAULT_MAX_SECONDS,
  DEFAULT_OPENROUTER_MODEL,
  readConfig,
  type Env,
} from "./config.ts"

const COMPLETE: Env = {
  LIVEKIT_URL: "wss://example.livekit.cloud",
  LIVEKIT_API_KEY: "key",
  LIVEKIT_API_SECRET: "secret",
  DEEPGRAM_API_KEY: "dg-key",
  OPENROUTER_API_KEY: "or-key",
  CONVEX_SITE_URL: "https://happy-animal-123.convex.site/",
  VOICE_AGENT_SECRET: "shared",
}

describe("readConfig", () => {
  it("reads a complete environment, with the defaults for the optional names", () => {
    expect(readConfig(COMPLETE)).toEqual({
      agentName: DEFAULT_AGENT_NAME,
      deepgramApiKey: "dg-key",
      openRouterApiKey: "or-key",
      openRouterModel: DEFAULT_OPENROUTER_MODEL,
      convexSiteUrl: "https://happy-animal-123.convex.site",
      agentSecret: "shared",
      maxSessionMs: DEFAULT_MAX_SECONDS * 1000,
    })
  })

  it("takes the model and the session limit when they are set", () => {
    const config = readConfig({
      ...COMPLETE,
      OPENROUTER_MODEL: " anthropic/claude-sonnet-5.5 ",
      VOICE_MAX_SECONDS: "90",
      AGENT_NAME: "voice-assistant-review",
    })

    expect(config.agentName).toBe("voice-assistant-review")

    expect(config.openRouterModel).toBe("anthropic/claude-sonnet-5.5")
    expect(config.maxSessionMs).toBe(90_000)
  })

  it("names every missing variable in one message", () => {
    expect(() =>
      readConfig({ ...COMPLETE, LIVEKIT_URL: "", DEEPGRAM_API_KEY: "", VOICE_AGENT_SECRET: "  " }),
    ).toThrow("Set LIVEKIT_URL, DEEPGRAM_API_KEY, VOICE_AGENT_SECRET (see agent/.env.example).")
  })

  it("refuses a session limit that isn't a whole number of seconds up to an hour", () => {
    for (const seconds of ["0", "-5", "1.5", "3601", "five"]) {
      expect(() => readConfig({ ...COMPLETE, VOICE_MAX_SECONDS: seconds })).toThrow(
        "VOICE_MAX_SECONDS must be a whole number",
      )
    }
  })

  it("refuses a site URL that isn't http(s)", () => {
    expect(() => readConfig({ ...COMPLETE, CONVEX_SITE_URL: "not a url" })).toThrow(
      "CONVEX_SITE_URL must be a URL",
    )
    expect(() => readConfig({ ...COMPLETE, CONVEX_SITE_URL: "ftp://example.com" })).toThrow(
      "CONVEX_SITE_URL must be an http(s) URL.",
    )
  })
})
