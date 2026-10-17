import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api, internal } from "./_generated/api"
import { WAV_BYTES_PER_SEC } from "./clientFeedback"
import { WRONG_STAGE } from "./lib/access"
import { RECORDED_ANSWERS } from "./lib/recordedAnswers"
import { MAX_VOICE_FEEDBACK_SEC, usageDay } from "./lib/usage"
import {
  newBackend,
  OWNER_EMAILS,
  projectWithLink,
  signedIn,
  storedFile,
  type TestBackend,
} from "./test.setup"

const SPOKEN = "The floor plan works. Printing cuts the last row. Please show free chairs."
const SPLIT = [
  { kind: "works", text: "The floor plan works." },
  { kind: "broken", text: "Printing cuts the last row." },
  { kind: "request", text: "Show free chairs per table." },
]

async function fixture({ withPrototype = true } = {}) {
  const t = newBackend()
  const owner = await signedIn(t, "owner@example.com")
  const { projectId, token } = await projectWithLink(t, owner.userId, ["feedback"])
  const slug = await t.run(async (ctx) => (await ctx.db.get(projectId))?.slug ?? "")

  await t.mutation(internal.projects.setStage, { slug, stage: "feedback" })

  if (withPrototype) {
    await t.mutation(internal.prototypes.registerPrototype, {
      slug,
      kind: "devApp",
      url: "https://demo-dev.example.com",
    })
  }

  return { t, token }
}

async function settle(t: TestBackend) {
  await t.finishAllScheduledFunctions(() => vi.runAllTimers())
}

function openRouterAnswers() {
  const fetchMock = vi.fn<typeof fetch>((url) => {
    const body = (url as string).endsWith("/audio/transcriptions")
      ? { text: SPOKEN }
      : { choices: [{ message: { content: JSON.stringify({ items: SPLIT }) } }] }

    return Promise.resolve(new Response(JSON.stringify(body)))
  })

  vi.stubGlobal("fetch", fetchMock)

  return fetchMock
}

function sentJson(fetchMock: ReturnType<typeof openRouterAnswers>, call: number) {
  return JSON.parse(fetchMock.mock.calls[call]?.[1]?.body as string) as Record<string, unknown>
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
  vi.stubEnv("OPENROUTER_API_KEY", "")
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("text feedback", () => {
  it("splits written feedback with the recorded answer when there is no key", async () => {
    const { t, token } = await fixture()

    await t.mutation(api.clientFeedback.submitText, { token, text: `  ${SPOKEN}  ` })
    await settle(t)

    const { prototype, feedback } = await t.query(api.clientFeedback.forClient, { token })

    expect(prototype).toEqual({ kind: "devApp", url: "https://demo-dev.example.com" })
    expect(feedback).toEqual([
      expect.objectContaining({
        mode: "text",
        transcript: SPOKEN,
        status: "done",
        items: RECORDED_ANSWERS.feedbackSplit().items,
      }),
    ])
  })

  it("sends the client's words to the model as data, never as its instructions", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key")
    const fetchMock = openRouterAnswers()
    const { t, token } = await fixture()

    await t.mutation(api.clientFeedback.submitText, { token, text: SPOKEN })
    await settle(t)

    const messages = sentJson(fetchMock, 0).messages as { role: string; content: string }[]

    expect(messages.find((message) => message.role === "user")?.content).toBe(SPOKEN)
    expect(messages.find((message) => message.role === "system")?.content).not.toContain(SPOKEN)
    expect((await t.query(api.clientFeedback.forClient, { token })).feedback[0]?.items).toEqual(
      SPLIT,
    )
  })

  it("rejects empty feedback, and feedback before there is a prototype", async () => {
    const withPrototype = await fixture()
    const withoutPrototype = await fixture({ withPrototype: false })

    await expect(
      withPrototype.t.mutation(api.clientFeedback.submitText, {
        token: withPrototype.token,
        text: "  ",
      }),
    ).rejects.toThrow("Write what you think")
    await expect(
      withoutPrototype.t.mutation(api.clientFeedback.submitText, {
        token: withoutPrototype.token,
        text: SPOKEN,
      }),
    ).rejects.toThrow("no prototype")
  })

  it("rejects a client link that doesn't open the feedback stage", async () => {
    const t = newBackend()
    const owner = await signedIn(t, "owner@example.com")
    const { token } = await projectWithLink(t, owner.userId, ["prototype"])

    await expect(t.query(api.clientFeedback.forClient, { token })).rejects.toThrow(WRONG_STAGE)
  })
})

describe("voice feedback", () => {
  it("is offered only when OPENROUTER_API_KEY is set", async () => {
    const { t, token } = await fixture()

    expect(await t.query(api.clientFeedback.voiceEnabled, {})).toBe(false)
    await expect(t.mutation(api.clientFeedback.generateUploadUrl, { token })).rejects.toThrow(
      "isn't set up",
    )

    vi.stubEnv("OPENROUTER_API_KEY", "test-key")

    expect(await t.query(api.clientFeedback.voiceEnabled, {})).toBe(true)
  })

  it("transcribes a voice note, splits it, and counts its seconds", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key")
    const fetchMock = openRouterAnswers()
    const { t, token } = await fixture()
    const audioFileId = await storedFile(t, "audio/wav", 10 * WAV_BYTES_PER_SEC)

    await t.mutation(api.clientFeedback.submitVoice, { token, audioFileId })
    await settle(t)

    const stt = sentJson(fetchMock, 0)
    const usage = await t.run(
      async (ctx) =>
        await ctx.db
          .query("usage")
          .withIndex("by_day", (q) => q.eq("day", usageDay(Date.now())).eq("kind", "sttSeconds"))
          .unique(),
    )

    expect(stt.model).toBe("microsoft/mai-transcribe-2")
    expect(stt.input_audio).toEqual(expect.objectContaining({ format: "wav" }))
    expect(usage?.count).toBe(10)
    expect((await t.query(api.clientFeedback.forClient, { token })).feedback).toEqual([
      expect.objectContaining({ mode: "voice", transcript: SPOKEN, items: SPLIT, status: "done" }),
    ])
  })

  it("refuses a voice note longer than 3 minutes", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key")
    const { t, token } = await fixture()
    const audioFileId = await storedFile(
      t,
      "audio/wav",
      (MAX_VOICE_FEEDBACK_SEC + 1) * WAV_BYTES_PER_SEC,
    )

    await expect(
      t.mutation(api.clientFeedback.submitVoice, { token, audioFileId }),
    ).rejects.toThrow("under 3 minutes")
  })

  it("marks the feedback failed when speech-to-text fails", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key")
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("down", { status: 503 })))
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { t, token } = await fixture()
    const audioFileId = await storedFile(t, "audio/wav", WAV_BYTES_PER_SEC)

    await t.mutation(api.clientFeedback.submitVoice, { token, audioFileId })
    await settle(t)

    expect((await t.query(api.clientFeedback.forClient, { token })).feedback[0]?.status).toBe(
      "failed",
    )
  })
})
