import { TokenVerifier } from "livekit-server-sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import {
  DEFAULT_AGENT_NAME,
  DEFAULT_SESSIONS_PER_DAY,
  usageDay,
  VOICE_CAP_REACHED,
  VOICE_KEYS,
  VOICE_NOT_SET_UP,
} from "./lib/voice"
import { newBackend, OWNER_EMAILS, signedIn, type TestBackend, type TestCaller } from "./test.setup"

// The token mint (convex/livekit.ts): who may start a session, the daily cap, and what the token
// grants. The keys are made up; nothing here reaches LiveKit.

const LIVEKIT_URL = "wss://example.livekit.cloud"
const API_KEY = "APIexample"
const API_SECRET = "example-secret-that-is-long-enough-for-hs256"

async function fixture() {
  const t = newBackend()
  const owner = await signedIn(t, "owner@example.com")
  const other = await signedIn(t, "other@example.com")
  const stranger = await signedIn(t, "stranger@example.com")
  const projectId = await owner.as.mutation(api.projects.create, { name: "Spring launch" })
  const project = await t.run(async (ctx) => await ctx.db.get(projectId))

  return { t, owner, other, stranger, projectId, shareToken: project!.shareToken }
}

async function usage(t: TestBackend): Promise<number> {
  return await t.run(async (ctx) => {
    const rows = await ctx.db.query("voiceUsage").collect()

    return rows.reduce((sum, row) => sum + row.sessions, 0)
  })
}

async function start(caller: TestCaller, projectId: Id<"projects">, shareToken?: string) {
  return await caller.mutation(api.livekit.startSession, { projectId, shareToken })
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
  it("mints a token for the owner that joins one new room and dispatches the agent", async () => {
    const { t, owner, projectId } = await fixture()
    const connection = await start(owner.as, projectId)
    const claims = await new TokenVerifier(API_KEY, API_SECRET).verify(connection.participantToken)

    expect(connection.serverUrl).toBe(LIVEKIT_URL)
    expect(connection.roomName).toMatch(/^voice-[A-Za-z0-9_-]{32}$/)
    expect(claims.sub).toBe(`owner-${connection.sessionId}`)
    expect(claims.name).toBe("Owner")
    expect(claims.video).toEqual({
      room: connection.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })
    expect(claims.roomConfig?.agents).toHaveLength(1)
    expect(claims.roomConfig?.agents[0]?.agentName).toBe(DEFAULT_AGENT_NAME)
    expect(JSON.parse(claims.roomConfig?.agents[0]?.metadata ?? "")).toEqual({
      sessionId: connection.sessionId,
    })
    expect(claims.exp! - claims.nbf!).toBe(600)

    const session = await t.run(async (ctx) => await ctx.db.get(connection.sessionId))

    expect(session).toMatchObject({ projectId, roomName: connection.roomName })
    expect(session?.endedAt).toBeUndefined()
    expect(await usage(t)).toBe(1)
  })

  it("gives every session its own room", async () => {
    const { owner, projectId } = await fixture()
    const first = await start(owner.as, projectId)
    const second = await start(owner.as, projectId)

    expect(first.roomName).not.toBe(second.roomName)
    expect(first.sessionId).not.toBe(second.sessionId)
  })

  it("lets a guest with the share link start one, as a guest", async () => {
    const { t, projectId, shareToken } = await fixture()
    const connection = await start(t, projectId, shareToken)
    const claims = await new TokenVerifier(API_KEY, API_SECRET).verify(connection.participantToken)

    expect(claims.sub).toBe(`guest-${connection.sessionId}`)
    expect(claims.name).toBe("Guest")
  })

  it("refuses everyone else, and counts nothing for them", async () => {
    const { t, owner, other, stranger, projectId } = await fixture()
    const refusals: [TestCaller, string | undefined][] = [
      [other.as, undefined],
      [stranger.as, undefined],
      [t, undefined],
      [t, "wrong-token"],
      [owner.as, "wrong-token"],
    ]

    for (const [caller, token] of refusals) {
      await expect(start(caller, projectId, token)).rejects.toThrow("Not allowed")
    }

    expect(await usage(t)).toBe(0)
    expect(await t.run(async (ctx) => await ctx.db.query("voiceSessions").collect())).toEqual([])
  })

  it("says voice isn't set up when the LiveKit keys are missing, and counts nothing", async () => {
    const { t, owner, projectId } = await fixture()

    vi.stubEnv("LIVEKIT_API_SECRET", "")

    await expect(start(owner.as, projectId)).rejects.toThrow(VOICE_NOT_SET_UP)
    expect(await usage(t)).toBe(0)
  })

  it("refuses without the Deepgram key too: voice is off", async () => {
    const { t, owner, projectId } = await fixture()

    vi.stubEnv("DEEPGRAM_API_KEY", "")

    expect(await t.query(api.voice.enabled, {})).toBe(false)
    await expect(start(owner.as, projectId)).rejects.toThrow(VOICE_NOT_SET_UP)
    expect(await usage(t)).toBe(0)
  })

  it("dispatches the worker named by AGENT_NAME", async () => {
    const { owner, projectId } = await fixture()

    vi.stubEnv("AGENT_NAME", "voice-assistant-review")

    const connection = await start(owner.as, projectId)
    const claims = await new TokenVerifier(API_KEY, API_SECRET).verify(connection.participantToken)

    expect(claims.roomConfig?.agents[0]?.agentName).toBe("voice-assistant-review")
  })
})

describe("voice.enabled", () => {
  it("is on with the five keys, for anyone, signed in or not", async () => {
    const { t, owner } = await fixture()

    expect(await t.query(api.voice.enabled, {})).toBe(true)
    expect(await owner.as.query(api.voice.enabled, {})).toBe(true)
  })

  it("is off when any of them is missing", async () => {
    const { t } = await fixture()

    for (const name of VOICE_KEYS) {
      vi.stubEnv(name, "")
      expect(await t.query(api.voice.enabled, {})).toBe(false)
      vi.stubEnv(name, "set")
    }
  })
})

describe("the daily cap", () => {
  it("refuses past VOICE_SESSIONS_PER_DAY, owner and guests together", async () => {
    const { t, owner, projectId, shareToken } = await fixture()

    vi.stubEnv("VOICE_SESSIONS_PER_DAY", "2")

    await start(owner.as, projectId)
    await start(t, projectId, shareToken)
    await expect(start(owner.as, projectId)).rejects.toThrow(VOICE_CAP_REACHED)
    expect(await usage(t)).toBe(2)
    expect(await t.run(async (ctx) => await ctx.db.query("voiceSessions").collect())).toHaveLength(
      2,
    )
  })

  it("is off at 0, and refuses a value that isn't a whole number", async () => {
    const { owner, projectId } = await fixture()

    vi.stubEnv("VOICE_SESSIONS_PER_DAY", "0")
    await expect(start(owner.as, projectId)).rejects.toThrow(VOICE_CAP_REACHED)

    vi.stubEnv("VOICE_SESSIONS_PER_DAY", "lots")
    await expect(start(owner.as, projectId)).rejects.toThrow(
      "VOICE_SESSIONS_PER_DAY must be a whole number.",
    )
  })

  it("counts per UTC day, with a default when unset", async () => {
    const { t, owner, projectId } = await fixture()
    const yesterday = usageDay(Date.now() - 24 * 60 * 60 * 1000)

    await t.run(async (ctx) => {
      await ctx.db.insert("voiceUsage", { day: yesterday, sessions: DEFAULT_SESSIONS_PER_DAY })
    })

    await start(owner.as, projectId)

    const today = await t.run(
      async (ctx) =>
        await ctx.db
          .query("voiceUsage")
          .withIndex("by_day", (q) => q.eq("day", usageDay(Date.now())))
          .unique(),
    )

    expect(today?.sessions).toBe(1)
    expect(usageDay(Date.UTC(2026, 9, 17, 23, 59))).toBe("2026-10-17")
  })
})
