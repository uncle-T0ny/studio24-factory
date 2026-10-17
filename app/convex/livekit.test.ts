import { TokenVerifier } from "livekit-server-sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import { insertClientLink } from "./lib/clientLinks"
import { CAP_REACHED, DAILY_CAPS } from "./lib/usage"
import { DEFAULT_AGENT_NAME, VOICE_KEYS, VOICE_NOT_SET_UP } from "./lib/voice"
import {
  newBackend,
  OWNER_EMAILS,
  projectWithLink,
  signedIn,
  type TestBackend,
  type TestCaller,
} from "./test.setup"

const LIVEKIT_URL = "wss://example.livekit.cloud"
const API_KEY = "APIexample"
const API_SECRET = "example-secret-that-is-long-enough-for-hs256"

async function fixture() {
  const t = newBackend()
  const owner = await signedIn(t, "owner@example.com")
  const { projectId, linkId, token } = await projectWithLink(t, owner.userId, ["interview"])

  return { t, owner, projectId, linkId, token }
}

async function interviewsCounted(t: TestBackend): Promise<number> {
  return await t.run(async (ctx) => {
    const rows = await ctx.db.query("usage").collect()

    return rows.filter((row) => row.kind === "interviews").reduce((sum, row) => sum + row.count, 0)
  })
}

async function start(caller: TestCaller | TestBackend, token: string) {
  return await caller.mutation(api.livekit.startSession, { token })
}

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
  vi.stubEnv("LIVEKIT_URL", LIVEKIT_URL)
  vi.stubEnv("LIVEKIT_API_KEY", API_KEY)
  vi.stubEnv("LIVEKIT_API_SECRET", API_SECRET)
  vi.stubEnv("DEEPGRAM_API_KEY", "deepgram-example")
  vi.stubEnv("OPENROUTER_API_KEY", "openrouter-example")
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("livekit.startSession", () => {
  it("mints a token for the client link that joins one new room and dispatches the agent", async () => {
    const { t, projectId, linkId, token } = await fixture()
    const connection = await start(t, token)
    const claims = await new TokenVerifier(API_KEY, API_SECRET).verify(connection.participantToken)

    expect(connection.serverUrl).toBe(LIVEKIT_URL)
    expect(connection.roomName).toMatch(/^voice-[A-Za-z0-9_-]{32}$/)
    expect(claims.sub).toBe(`client-${connection.interviewId}`)
    expect(claims.video).toMatchObject({ room: connection.roomName, roomJoin: true })
    expect(claims.roomConfig?.agents[0]?.agentName).toBe(DEFAULT_AGENT_NAME)
    expect(JSON.parse(claims.roomConfig?.agents[0]?.metadata ?? "")).toEqual({
      interviewId: connection.interviewId,
    })
    expect(claims.exp! - claims.nbf!).toBe(600)

    const interview = await t.run(async (ctx) => await ctx.db.get(connection.interviewId))

    expect(interview).toMatchObject({ projectId, linkId, mode: "voice", status: "waiting" })
    expect(await interviewsCounted(t)).toBe(1)
  })

  it("gives every interview its own room", async () => {
    const { t, token } = await fixture()
    const first = await start(t, token)
    const second = await start(t, token)

    expect(first.roomName).not.toBe(second.roomName)
  })

  it("refuses a wrong token and a link for another stage, and counts nothing", async () => {
    const { t, owner, projectId } = await fixture()
    const prdLink = await t.run(async (ctx) => await insertClientLink(ctx, projectId, ["prd"]))

    await expect(start(owner.as, "wrong-token")).rejects.toThrow("isn't valid")
    await expect(start(t, prdLink.token)).rejects.toThrow("doesn't open this stage")
    expect(await interviewsCounted(t)).toBe(0)
  })

  it("says voice isn't set up when a key is missing, and counts nothing", async () => {
    const { t, token } = await fixture()

    vi.stubEnv("DEEPGRAM_API_KEY", "")

    expect(await t.query(api.voice.enabled, {})).toBe(false)
    await expect(start(t, token)).rejects.toThrow(VOICE_NOT_SET_UP)
    expect(await interviewsCounted(t)).toBe(0)
  })

  it("dispatches the worker named by AGENT_NAME", async () => {
    const { t, token } = await fixture()

    vi.stubEnv("AGENT_NAME", "voice-assistant-review")

    const connection = await start(t, token)
    const claims = await new TokenVerifier(API_KEY, API_SECRET).verify(connection.participantToken)

    expect(claims.roomConfig?.agents[0]?.agentName).toBe("voice-assistant-review")
  })

  it("refuses past the daily interview cap", async () => {
    const { t, token } = await fixture()
    const cap = DAILY_CAPS.interviews ?? 0

    for (let i = 0; i < cap; i += 1) {
      await start(t, token)
    }

    await expect(start(t, token)).rejects.toThrow(CAP_REACHED)
    expect(await interviewsCounted(t)).toBe(cap)
  })
})

describe("voice.enabled", () => {
  it("is on with the five keys and off when any of them is missing", async () => {
    const { t } = await fixture()

    expect(await t.query(api.voice.enabled, {})).toBe(true)

    for (const name of VOICE_KEYS) {
      vi.stubEnv(name, "")
      expect(await t.query(api.voice.enabled, {})).toBe(false)
      vi.stubEnv(name, "set")
    }
  })
})
