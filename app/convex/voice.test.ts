import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import { AGENT_EVENTS_PATH, TranscriptSource, VoiceRole } from "./lib/voice"
import { newBackend, OWNER_EMAILS, signedIn, type TestBackend } from "./test.setup"

// The transcript ingest (convex/http.ts, lib/voiceData.ts) and the typed fallback
// (voice.saveTypedMessage). The agent's side of the contract is agent/src/transcript.ts.

const SECRET = "agent-secret-for-tests"

async function fixture() {
  const t = newBackend()
  const owner = await signedIn(t, "owner@example.com")
  const projectId = await owner.as.mutation(api.projects.create, { name: "Spring launch" })
  const project = await t.run(async (ctx) => await ctx.db.get(projectId))
  const roomName = "voice-room-1"
  const sessionId = await t.run(
    async (ctx) =>
      await ctx.db.insert("voiceSessions", {
        ownerId: owner.userId,
        projectId,
        roomName,
        startedAt: 1,
      }),
  )

  return { t, owner, projectId, shareToken: project!.shareToken, roomName, sessionId }
}

function post(t: TestBackend, body: unknown, authorization: string | null = `Bearer ${SECRET}`) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }

  if (authorization !== null) {
    headers.Authorization = authorization
  }

  return t.fetch(AGENT_EVENTS_PATH, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

function turn(roomName: string, index: number, text: string, role = VoiceRole.User) {
  return { type: "turn", roomName, index, role, text, at: 100 + index }
}

async function transcript(t: TestBackend) {
  const rows = await t.run(async (ctx) => await ctx.db.query("voiceTranscripts").collect())

  return rows
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map(({ index, role, text, source }) => ({ index, role, text, source }))
}

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
  vi.stubEnv("VOICE_AGENT_SECRET", SECRET)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("the agent events route", () => {
  it("refuses a wrong, missing or malformed secret, and stores nothing", async () => {
    const { t, roomName } = await fixture()

    for (const authorization of [
      "Bearer wrong-secret",
      `Bearer ${SECRET}x`,
      SECRET,
      `Basic ${SECRET}`,
      null,
    ]) {
      const response = await post(t, turn(roomName, 0, "Hello"), authorization)

      expect(response.status).toBe(401)
    }

    expect(await transcript(t)).toEqual([])
  })

  it("lets nobody in while VOICE_AGENT_SECRET is unset", async () => {
    const { t, roomName } = await fixture()

    vi.stubEnv("VOICE_AGENT_SECRET", "")

    expect((await post(t, turn(roomName, 0, "Hello"), "Bearer ")).status).toBe(401)
    expect((await post(t, turn(roomName, 0, "Hello"))).status).toBe(401)
  })

  it("stores each turn once, however often it is sent", async () => {
    const { t, roomName } = await fixture()

    expect((await post(t, turn(roomName, 0, "Hello!", VoiceRole.Assistant))).status).toBe(204)
    expect((await post(t, turn(roomName, 1, "Hi there"))).status).toBe(204)
    expect((await post(t, turn(roomName, 1, "Hi there"))).status).toBe(204)

    expect(await transcript(t)).toEqual([
      { index: 0, role: VoiceRole.Assistant, text: "Hello!", source: TranscriptSource.Voice },
      { index: 1, role: VoiceRole.User, text: "Hi there", source: TranscriptSource.Voice },
    ])
  })

  it("refuses a body that isn't an agent event, and a room it doesn't know", async () => {
    const { t, roomName } = await fixture()

    expect((await post(t, "not json")).status).toBe(400)
    expect((await post(t, { ...turn(roomName, 0, "Hi"), role: "system" })).status).toBe(400)
    expect((await post(t, { type: "turn", roomName })).status).toBe(400)
    expect((await post(t, turn("voice-unknown", 0, "Hi"))).status).toBe(404)
    expect(await transcript(t)).toEqual([])
  })

  it("replaces the turns with the history at the end, closes the session, and stays put", async () => {
    const { t, roomName, sessionId } = await fixture()
    const history = [
      { index: 0, role: VoiceRole.Assistant, text: "Hello! How can I help?", at: 100 },
      { index: 1, role: VoiceRole.User, text: "What's the time?", at: 101 },
    ]
    const end = {
      type: "end",
      roomName,
      reason: "participant_disconnected",
      at: 200,
      turns: history,
    }

    await post(t, turn(roomName, 0, "Hello! How can", VoiceRole.Assistant))
    await post(t, turn(roomName, 5, "A turn the history doesn't have"))

    expect((await post(t, end)).status).toBe(204)
    expect((await post(t, end)).status).toBe(204)
    expect((await post(t, turn(roomName, 2, "Too late"))).status).toBe(204)

    expect(await transcript(t)).toEqual(
      history.map(({ index, role, text }) => ({
        index,
        role,
        text,
        source: TranscriptSource.Voice,
      })),
    )

    const session = await t.run(async (ctx) => await ctx.db.get(sessionId))

    expect(session).toMatchObject({ endedAt: 200, endReason: "participant_disconnected" })
  })
})

describe("voice.saveTypedMessage", () => {
  it("saves the owner's and a guest's typed message, and refuses everyone else", async () => {
    const { t, owner, projectId, shareToken } = await fixture()
    const stranger = await signedIn(t, "stranger@example.com")

    await owner.as.mutation(api.voice.saveTypedMessage, { projectId, text: " My mic is broken " })
    await t.mutation(api.voice.saveTypedMessage, { projectId, text: "Guest here", shareToken })

    await expect(
      stranger.as.mutation(api.voice.saveTypedMessage, { projectId, text: "Hijack" }),
    ).rejects.toThrow("Not allowed")
    await expect(
      owner.as.mutation(api.voice.saveTypedMessage, { projectId, text: "   " }),
    ).rejects.toThrow("Write a message first.")

    expect((await transcript(t)).map(({ text, source }) => ({ text, source }))).toEqual([
      { text: "My mic is broken", source: TranscriptSource.Typed },
      { text: "Guest here", source: TranscriptSource.Typed },
    ])
  })
})

describe("projects.remove", () => {
  it("deletes the project's voice sessions and transcript with it", async () => {
    const { t, owner, projectId, roomName } = await fixture()

    await post(t, turn(roomName, 0, "Hello"))
    await owner.as.mutation(api.voice.saveTypedMessage, { projectId, text: "Typed" })
    await owner.as.mutation(api.projects.remove, { projectId })

    const left = await t.run(async (ctx) => ({
      sessions: await ctx.db.query("voiceSessions").collect(),
      transcripts: await ctx.db.query("voiceTranscripts").collect(),
    }))

    expect(left).toEqual({ sessions: [], transcripts: [] })
  })
})
