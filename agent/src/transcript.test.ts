import { describe, expect, it, vi } from "vitest"
import {
  AGENT_EVENTS_PATH,
  createTranscriptPoster,
  createTurnCounter,
  historyTurns,
  MAX_TURN_LENGTH,
  type AgentEvent,
  type Message,
} from "./transcript.ts"

const SITE = "https://happy-animal-123.convex.site"
const TURN: AgentEvent = {
  type: "turn",
  roomName: "voice-1",
  index: 0,
  role: "user",
  text: "Hi",
  at: 1,
}
const END: AgentEvent = { type: "end", roomName: "voice-1", reason: "ended", at: 2, turns: [] }

const MESSAGES: Message[] = [
  { role: "system", textContent: "You are a friendly voice assistant.", createdAt: 1 },
  { role: "assistant", textContent: "  Hello! How can I help? ", createdAt: 2 },
  { role: "user", textContent: "What's the time?", createdAt: 3 },
  { role: "assistant", textContent: "   ", createdAt: 4 },
  { role: "developer", textContent: "Note", createdAt: 5 },
  { role: "assistant", textContent: undefined, createdAt: 6 },
  { role: "assistant", textContent: "I can't see a clock, sorry.", createdAt: 7 },
]

const EXPECTED_TURNS = [
  { index: 0, role: "assistant", text: "Hello! How can I help?", at: 2 },
  { index: 1, role: "user", text: "What's the time?", at: 3 },
  { index: 2, role: "assistant", text: "I can't see a clock, sorry.", at: 7 },
]

function answers(...statuses: (number | Error)[]) {
  const queue = [...statuses]

  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => {
    const next = queue.shift() ?? 200

    if (next instanceof Error) {
      throw next
    }

    return new Response(null, { status: next })
  })
}

function poster(fetch: ReturnType<typeof answers>) {
  const logger = { warn: vi.fn() }
  const sleep = vi.fn(async (_ms: number) => undefined)
  const transcript = createTranscriptPoster({ siteUrl: SITE, secret: "shh", logger, fetch, sleep })

  return { logger, sleep, transcript }
}

describe("turns", () => {
  it("keep user and assistant messages with text, trimmed and numbered in order", () => {
    expect(historyTurns(MESSAGES)).toEqual(EXPECTED_TURNS)
  })

  it("are numbered the same way as they are committed and at the end", () => {
    const next = createTurnCounter("voice-1")
    const events = MESSAGES.map(next).filter((event) => event !== null)

    expect(events).toEqual(
      EXPECTED_TURNS.map((turn) => ({ type: "turn", roomName: "voice-1", ...turn })),
    )
  })

  it("clip a long text", () => {
    const [turn] = historyTurns([
      { role: "user", textContent: "x".repeat(MAX_TURN_LENGTH + 10), createdAt: 1 },
    ])

    expect(turn?.text).toHaveLength(MAX_TURN_LENGTH)
  })
})

describe("createTranscriptPoster", () => {
  it("POSTs each event as JSON with the shared secret, in order", async () => {
    const fetch = answers(200, 200)
    const { transcript } = poster(fetch)

    transcript.post(TURN)
    transcript.post(END)
    await transcript.flush()

    expect(fetch).toHaveBeenCalledTimes(2)
    const [url, init] = fetch.mock.calls[0]!

    expect(url).toBe(`${SITE}${AGENT_EVENTS_PATH}`)
    expect(init?.method).toBe("POST")
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer shh",
    })
    expect(fetch.mock.calls.map(([, sent]) => JSON.parse(sent?.body as string) as unknown)).toEqual(
      [TURN, END],
    )
  })

  it("retries a network error and a 5xx with backoff, then gives up with a warning", async () => {
    const fetch = answers(new Error("offline"), 503, 500)
    const { transcript, logger, sleep } = poster(fetch)

    transcript.post(TURN)
    await transcript.flush()

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([250, 500])
    expect(logger.warn).toHaveBeenCalledWith(
      { type: "turn", roomName: "voice-1", status: 500 },
      "transcript event not delivered",
    )
  })

  it("doesn't retry a 4xx, and the next event still goes out", async () => {
    const fetch = answers(401, 200)
    const { transcript, logger } = poster(fetch)

    transcript.post(TURN)
    transcript.post(END)
    await transcript.flush()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  it("stops retrying once an attempt succeeds", async () => {
    const fetch = answers(502, 200)
    const { transcript, logger } = poster(fetch)

    transcript.post(TURN)
    await transcript.flush()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
