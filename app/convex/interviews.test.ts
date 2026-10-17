import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import { WRONG_STAGE } from "./lib/access"
import { FIXTURE_TRANSCRIPT } from "./lib/fixtureTranscript"
import { newBackend, OWNER_EMAILS, projectWithLink, signedIn, type TestBackend } from "./test.setup"

async function fixture(stages: ("interview" | "prd")[] = ["interview"]) {
  const t = newBackend()
  const owner = await signedIn(t, "owner@example.com")
  const link = await projectWithLink(t, owner.userId, stages)

  return { t, ...link }
}

async function settle(t: TestBackend) {
  await t.finishAllScheduledFunctions(() => vi.runAllTimers())
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
  vi.stubEnv("OPENROUTER_API_KEY", "")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe("the text interview", () => {
  it("asks the recorded questions in order, takes the sample answers and ends after the last", async () => {
    const { t, token } = await fixture()
    const interviewId = await t.mutation(api.interviews.startText, { token })

    await settle(t)

    for (;;) {
      const view = await t.query(api.interviews.current, { token })

      if (!view?.sampleAnswer) {
        break
      }

      await t.mutation(api.interviews.answer, { token, interviewId, text: view.sampleAnswer })
      await settle(t)
    }

    const view = await t.query(api.interviews.current, { token })

    expect(view).toMatchObject({ mode: "text", status: "done", isRecorded: true })
    expect(view?.turns).toEqual(FIXTURE_TRANSCRIPT)
  })

  it("opens with a non-empty user message, which the model provider requires", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key")
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            choices: [
              { message: { content: '{"question":"What should the app do?","done":false}' } },
            ],
          }),
        ),
    )
    vi.stubGlobal("fetch", fetchMock)
    const { t, token } = await fixture()

    await t.mutation(api.interviews.startText, { token })
    await settle(t)

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      messages: { role: string; content: string }[]
    }

    expect(body.messages.find((message) => message.role === "user")?.content).not.toBe("")
    expect(await t.query(api.interviews.current, { token })).toMatchObject({
      status: "live",
      isRecorded: false,
      turns: [{ seq: 1, speaker: "agent", text: "What should the app do?" }],
    })
  })

  it("refuses a second answer before the next question", async () => {
    const { t, token } = await fixture()
    const interviewId = await t.mutation(api.interviews.startText, { token })

    await expect(
      t.mutation(api.interviews.answer, { token, interviewId, text: "Too early" }),
    ).rejects.toThrow("Wait for the next question.")
  })

  it("records why voice fell back to text and closes the waiting voice interview", async () => {
    const { t, token, projectId, linkId } = await fixture()
    const voiceId = await t.run(
      async (ctx) =>
        await ctx.db.insert("interviews", {
          projectId,
          linkId,
          mode: "voice",
          status: "waiting",
          roomName: "voice-room",
        }),
    )
    const textId = await t.mutation(api.interviews.startText, {
      token,
      failure: "agentUnavailable",
    })
    const [voice, text] = await t.run(
      async (ctx) => await Promise.all([ctx.db.get(voiceId), ctx.db.get(textId)]),
    )

    expect(voice).toMatchObject({ status: "failed", failure: "agentUnavailable" })
    expect(text).toMatchObject({ mode: "text", status: "live", failure: "agentUnavailable" })
  })

  it("rejects a client link that doesn't open the interview stage", async () => {
    const { t, token } = await fixture(["prd"])

    await expect(t.mutation(api.interviews.startText, { token })).rejects.toThrow(WRONG_STAGE)
    await expect(t.query(api.interviews.current, { token })).rejects.toThrow(WRONG_STAGE)
  })
})
