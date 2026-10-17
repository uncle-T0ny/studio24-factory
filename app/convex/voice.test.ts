import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import { AGENT_EVENTS_PATH, VoiceRole } from "./lib/voice"
import { newBackend, OWNER_EMAILS, projectWithLink, signedIn, type TestBackend } from "./test.setup"

const SECRET = "agent-secret-for-tests"

async function fixture() {
  const t = newBackend()
  const owner = await signedIn(t, "owner@example.com")
  const { projectId, linkId, token } = await projectWithLink(t, owner.userId, ["interview"])
  const roomName = "voice-room-1"
  const interviewId = await t.run(
    async (ctx) =>
      await ctx.db.insert("interviews", {
        projectId,
        linkId,
        mode: "voice",
        status: "live",
        roomName,
        startedAt: 1,
      }),
  )

  return { t, owner, projectId, token, roomName, interviewId }
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
  const rows = await t.run(async (ctx) => await ctx.db.query("transcriptTurns").collect())

  return rows
    .sort((a, b) => a.seq - b.seq)
    .map(({ seq, speaker, text }) => ({ seq, speaker, text }))
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
      { seq: 0, speaker: "agent", text: "Hello!" },
      { seq: 1, speaker: "client", text: "Hi there" },
    ])
  })

  it("marks a waiting interview live at the agent's first turn", async () => {
    const { t, roomName, interviewId } = await fixture()

    await t.run(async (ctx) => await ctx.db.patch(interviewId, { status: "waiting" }))
    await post(t, turn(roomName, 0, "Hello!", VoiceRole.Assistant))

    expect(await t.run(async (ctx) => await ctx.db.get(interviewId))).toMatchObject({
      status: "live",
    })
  })

  it("refuses a body that isn't an agent event, and a room it doesn't know", async () => {
    const { t, roomName } = await fixture()

    expect((await post(t, "not json")).status).toBe(400)
    expect((await post(t, { ...turn(roomName, 0, "Hi"), role: "system" })).status).toBe(400)
    expect((await post(t, { type: "turn", roomName })).status).toBe(400)
    expect((await post(t, turn("voice-unknown", 0, "Hi"))).status).toBe(404)
    expect(await transcript(t)).toEqual([])
  })

  it("replaces the turns with the history at the end, closes the interview, and stays put", async () => {
    const { t, roomName, interviewId } = await fixture()
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

    expect(await transcript(t)).toEqual([
      { seq: 0, speaker: "agent", text: "Hello! How can I help?" },
      { seq: 1, speaker: "client", text: "What's the time?" },
    ])

    const interview = await t.run(async (ctx) => await ctx.db.get(interviewId))

    expect(interview).toMatchObject({ status: "done", endedAt: 200, durationSec: 0 })
  })
})

describe("projects.remove", () => {
  it("deletes the project's links, interviews and transcript with it", async () => {
    const { t, owner, projectId, roomName } = await fixture()

    await post(t, turn(roomName, 0, "Hello"))
    await owner.as.mutation(api.projects.remove, { projectId })

    const left = await t.run(async (ctx) => [
      ...(await ctx.db.query("clientLinks").collect()),
      ...(await ctx.db.query("interviews").collect()),
      ...(await ctx.db.query("transcriptTurns").collect()),
    ])

    expect(left).toEqual([])
  })
})
