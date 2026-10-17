import { v } from "convex/values"
import { afterEach, describe, expect, it, vi } from "vitest"
import { askLlm, jsonSchemaOf, LlmTask, RECORDED_MODEL } from "./llm"
import { RECORDED_ANSWERS } from "./recordedAnswers"

const answer = v.object({ title: v.string(), note: v.optional(v.string()) })

function request(task: LlmTask) {
  return { task, instructions: "Draft it.", data: "The transcript.", answer }
}

function openRouterReplies(...statuses: number[]) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const status of statuses) {
    const body =
      status === 200 ? { choices: [{ message: { content: '{"title":"Plan"}' } }] } : { error: "x" }
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
  }
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function sentBody(fetchMock: ReturnType<typeof openRouterReplies>, call: number) {
  return JSON.parse(fetchMock.mock.calls[call]?.[1]?.body as string) as Record<string, unknown>
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("askLlm", () => {
  it("returns the recorded answer, labelled, and counts no call without OPENROUTER_API_KEY", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "")
    const countCall = vi.fn(() => Promise.resolve())

    const result = await askLlm(request(LlmTask.Prd), countCall)

    expect(result).toEqual({ json: RECORDED_ANSWERS.prd, model: RECORDED_MODEL })
    expect(countCall).not.toHaveBeenCalled()
  })

  it("asks Sonnet with low reasoning effort and a strict JSON schema for the PRD", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key")
    const fetchMock = openRouterReplies(200)

    const result = await askLlm(request(LlmTask.Prd), () => Promise.resolve())

    expect(result).toEqual({ json: { title: "Plan" }, model: "anthropic/claude-sonnet-5.5" })
    expect(sentBody(fetchMock, 0)).toMatchObject({
      model: "anthropic/claude-sonnet-5.5",
      reasoning: { effort: "low" },
      response_format: { type: "json_schema", json_schema: { name: "prd", strict: true } },
    })
  })

  it("asks Haiku with reasoning off for the manifest, and Sonnet when Haiku rejects the schema", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key")
    const fetchMock = openRouterReplies(400, 200)
    const countCall = vi.fn(() => Promise.resolve())

    const result = await askLlm(request(LlmTask.Manifest), countCall)

    expect(sentBody(fetchMock, 0)).toMatchObject({
      model: "anthropic/claude-haiku-5.5",
      reasoning: { enabled: false },
    })
    expect(result.model).toBe("anthropic/claude-sonnet-5.5")
    expect(countCall).toHaveBeenCalledTimes(2)
  })

  it("calls no model once the daily cap refuses the call", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key")
    const fetchMock = openRouterReplies(200)

    await expect(
      askLlm(request(LlmTask.Prd), () => Promise.reject(new Error("cap reached"))),
    ).rejects.toThrow("cap reached")
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("jsonSchemaOf", () => {
  it("requires every field but the optional ones and turns literal unions into enums", () => {
    const kind = v.union(v.literal("FR"), v.literal("NFR"))

    expect(jsonSchemaOf(v.object({ kind, note: v.optional(v.string()) }))).toEqual({
      type: "object",
      properties: { kind: { enum: ["FR", "NFR"] }, note: { type: "string" } },
      required: ["kind"],
      additionalProperties: false,
    })
  })
})
