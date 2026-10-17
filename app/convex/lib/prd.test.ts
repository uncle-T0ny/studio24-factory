import { describe, expect, it, vi } from "vitest"
import { FIXTURE_TRANSCRIPT } from "./fixtureTranscript"
import { type LlmAnswer, type LlmRequest } from "./llm"
import { checkPrd, draftPrd, type PrdAnswer, verifyQuote } from "./prd"
import { RECORDED_ANSWERS } from "./recordedAnswers"

const turns = FIXTURE_TRANSCRIPT.map((turn) => ({ ...turn, _id: `turn-${turn.seq}` }))
const recorded = RECORDED_ANSWERS.prd() as PrdAnswer

function modelAnswering(...answers: unknown[]) {
  const ask = vi.fn<(request: LlmRequest) => Promise<LlmAnswer>>()
  for (const json of answers) {
    ask.mockResolvedValueOnce({ json, model: "test-model" })
  }
  return ask
}

describe("drafting the PRD", () => {
  it("accepts the recorded answer, its quotes all verified but the paraphrased one", () => {
    expect(checkPrd(recorded).problems).toEqual([])

    const unverified = recorded.requirements.flatMap((requirement) =>
      requirement.quotes
        .filter((quote) => !verifyQuote(quote, turns).verified)
        .map(() => requirement.code),
    )
    expect(unverified).toEqual(["NFR-2"])
  })

  it("sends the transcript as numbered data lines", async () => {
    const ask = modelAnswering(recorded)

    await draftPrd(turns, ask)

    expect(ask).toHaveBeenCalledTimes(1)
    expect(ask.mock.calls[0]?.[0].data.split("\n")[1]).toBe(`[2] client: ${turns[1]?.text}`)
  })

  it("retries once, told the problems, when the first answer has the wrong shape", async () => {
    const ask = modelAnswering({ summary: "No requirements" }, recorded)

    const draft = await draftPrd(turns, ask)

    expect(ask).toHaveBeenCalledTimes(2)
    expect(ask.mock.calls[1]?.[0].instructions).toContain("Your previous answer had these problems")
    expect(draft).toEqual({ answer: recorded, problems: [], model: "test-model" })
  })

  it("keeps a second invalid answer as it is, flagged with its problems", async () => {
    const noQuote = {
      ...recorded,
      requirements: [{ ...recorded.requirements[0], code: "NFR-9", quotes: [] }],
    }
    const ask = modelAnswering(noQuote, noQuote)

    const draft = await draftPrd(turns, ask)

    expect(ask).toHaveBeenCalledTimes(2)
    expect(draft.answer).toEqual(noQuote)
    expect(draft.problems).toEqual(["NFR-9: an FR code reads FR-<number>.", "NFR-9 has no quote."])
  })

  it("flags two requirements sharing a code and a PRD without a functional requirement", () => {
    const nfr = { ...recorded.requirements[6], code: "NFR-1" }

    expect(checkPrd({ ...recorded, requirements: [nfr, nfr] }).problems).toEqual([
      "There is no functional requirement.",
      "Two requirements share a code.",
    ])
  })
})

describe("verifying a quote", () => {
  it("verifies the client's words despite case and punctuation", () => {
    const quote = { turn: 4, text: "i'd like to IMPORT a csv, with names" }

    expect(verifyQuote(quote, turns)).toEqual({
      turnId: "turn-4",
      text: quote.text,
      verified: true,
    })
  })

  it("moves a verbatim quote to the client turn that holds it when the cited turn doesn't", () => {
    expect(verifyQuote({ turn: 2, text: "only I can change it" }, turns)).toMatchObject({
      turnId: "turn-8",
      verified: true,
    })
  })

  it("refuses the agent's words, an empty quote and words nobody said", () => {
    expect(verifyQuote({ turn: 3, text: "How do you get the guest list" }, turns).verified).toBe(
      false,
    )
    expect(verifyQuote({ turn: 4, text: " ... " }, turns).verified).toBe(false)
    expect(verifyQuote({ turn: 99, text: "I need a mobile app" }, turns)).toEqual({
      turnId: undefined,
      text: "I need a mobile app",
      verified: false,
    })
  })
})
