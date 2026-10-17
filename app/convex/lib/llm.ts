import { type GenericValidator } from "convex/values"
import { RECORDED_ANSWERS } from "./recordedAnswers"

// Every model call in the app goes through askLlm. Without OPENROUTER_API_KEY it returns the
// recorded answer for its task, made on the fixture transcript, so the app runs with no keys.

export enum LlmTask {
  Prd = "prd",
  Manifest = "manifest",
  Analysis = "analysis",
  FeedbackSplit = "feedbackSplit",
}

export interface LlmRequest {
  task: LlmTask
  instructions: string
  // Untrusted text (a transcript, a README): sent as the user message, never as instructions.
  data: string
  answer: GenericValidator
}

export interface LlmAnswer {
  json: unknown
  model: string
}

// Bound to the daily usage check: throws once today's model calls are used up.
export type CountLlmCall = () => Promise<void>

export const RECORDED_MODEL = "recorded demo answer"

const SONNET = "anthropic/claude-sonnet-5.5"
const HAIKU = "anthropic/claude-haiku-5.5"
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

const TASK_MODEL: Record<LlmTask, string> = {
  [LlmTask.Prd]: SONNET,
  [LlmTask.Analysis]: SONNET,
  [LlmTask.Manifest]: HAIKU,
  [LlmTask.FeedbackSplit]: HAIKU,
}

type JsonSchema = Record<string, unknown>

class OpenRouterError extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`OpenRouter answered ${status}: ${detail}`)
  }
}

export function jsonSchemaOf(validator: GenericValidator): JsonSchema {
  switch (validator.kind) {
    case "string":
      return { type: "string" }
    case "float64":
      return { type: "number" }
    case "boolean":
      return { type: "boolean" }
    case "literal":
      return { enum: [validator.value] }
    case "array":
      return { type: "array", items: jsonSchemaOf(validator.element) }
    case "union": {
      const literals = validator.members.flatMap((member): unknown[] =>
        member.kind === "literal" ? [member.value] : [],
      )
      return literals.length === validator.members.length
        ? { enum: literals }
        : { anyOf: validator.members.map(jsonSchemaOf) }
    }
    case "object": {
      const fields = Object.entries(validator.fields)
      return {
        type: "object",
        properties: Object.fromEntries(fields.map(([name, field]) => [name, jsonSchemaOf(field)])),
        required: fields
          .filter(([, field]) => field.isOptional === "required")
          .map(([name]) => name),
        additionalProperties: false,
      }
    }
    default:
      throw new Error(`An answer can't hold a ${validator.kind} field`)
  }
}

// Sonnet 5.5 can't turn reasoning off (enabled:false or "none" is a 400), so it gets the lowest
// effort; Haiku runs with it off.
function reasoningFor(model: string) {
  return model === SONNET ? { effort: "low" } : { enabled: false }
}

async function callOpenRouter(key: string, model: string, request: LlmRequest): Promise<LlmAnswer> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      reasoning: reasoningFor(model),
      messages: [
        { role: "system", content: request.instructions },
        { role: "user", content: request.data },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: request.task, strict: true, schema: jsonSchemaOf(request.answer) },
      },
    }),
  })

  if (!response.ok) {
    throw new OpenRouterError(response.status, await response.text())
  }

  const body = (await response.json()) as { choices: { message: { content: string } }[] }
  const content = body.choices[0]?.message.content ?? ""

  return { json: JSON.parse(content), model }
}

export async function askLlm(request: LlmRequest, countCall: CountLlmCall): Promise<LlmAnswer> {
  const key = process.env.OPENROUTER_API_KEY

  if (!key) {
    return { json: RECORDED_ANSWERS[request.task], model: RECORDED_MODEL }
  }

  const model = TASK_MODEL[request.task]
  await countCall()

  try {
    return await callOpenRouter(key, model, request)
  } catch (error) {
    // Haiku may reject a schema Sonnet accepts; a 400 there retries once on Sonnet.
    if (model === HAIKU && error instanceof OpenRouterError && error.status === 400) {
      await countCall()
      return await callOpenRouter(key, SONNET, request)
    }
    throw error
  }
}
