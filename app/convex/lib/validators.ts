import { v, type Infer } from "convex/values"
import { literals } from "convex-helpers/validators"

export const STAGES = [
  "interview",
  "prd",
  "analysis",
  "prototype",
  "feedback",
  "final",
  "transferred",
] as const

export const stageValidator = literals(...STAGES)
export const stageStatusValidator = literals("pending", "active", "done", "skipped")
export const interviewModeValidator = literals("voice", "text")
export const interviewStatusValidator = literals("waiting", "live", "done", "failed")
export const interviewFailureValidator = literals(
  "micDenied",
  "agentUnavailable",
  "capReached",
  "error",
)
export const speakerValidator = literals("agent", "client")
export const prdStatusValidator = literals("draft", "accepted")
export const requirementKindValidator = literals("FR", "NFR")
export const priorityValidator = literals("must", "should", "could", "wont")
export const templateSourceValidator = literals("link", "seeded")
export const templateStatusValidator = literals("ready", "failed")
export const verdictValidator = literals("inTemplate", "extension", "notSupported")
export const prototypeKindValidator = literals("mockup", "devApp")
export const prototypeStatusValidator = literals("building", "ready", "failed")
export const feedbackItemKindValidator = literals("works", "broken", "request")
export const clientFeedbackStatusValidator = literals("pending", "done", "failed")
export const usageKindValidator = literals(
  "interviewMinutes",
  "interviews",
  "llmCalls",
  "sttSeconds",
)

export type Stage = Infer<typeof stageValidator>
export type UsageKind = Infer<typeof usageKindValidator>

export const projectFields = {
  ownerId: v.id("users"),
  clientName: v.string(),
  title: v.string(),
  slug: v.string(),
  stage: stageValidator,
  isDemo: v.boolean(),
  createdAt: v.number(),
}

export const stageEventFields = {
  projectId: v.id("projects"),
  stage: stageValidator,
  status: stageStatusValidator,
  startedAt: v.optional(v.number()),
  doneAt: v.optional(v.number()),
  note: v.optional(v.string()),
}

export const clientLinkFields = {
  projectId: v.id("projects"),
  tokenHash: v.string(),
  stages: v.array(stageValidator),
  requiresLogin: v.boolean(),
  expiresAt: v.optional(v.number()),
  revokedAt: v.optional(v.number()),
}

export const interviewFields = {
  projectId: v.id("projects"),
  linkId: v.id("clientLinks"),
  mode: interviewModeValidator,
  status: interviewStatusValidator,
  roomName: v.optional(v.string()),
  startedAt: v.optional(v.number()),
  endedAt: v.optional(v.number()),
  durationSec: v.optional(v.number()),
  failure: v.optional(interviewFailureValidator),
}

export const transcriptTurnFields = {
  interviewId: v.id("interviews"),
  projectId: v.id("projects"),
  seq: v.number(),
  speaker: speakerValidator,
  text: v.string(),
  at: v.number(),
}

export const prdFields = {
  projectId: v.id("projects"),
  version: v.number(),
  status: prdStatusValidator,
  summary: v.string(),
  outOfScope: v.array(v.string()),
  model: v.string(),
  validation: v.object({ ok: v.boolean(), problems: v.array(v.string()) }),
  createdAt: v.number(),
}

export const quoteValidator = v.object({
  turnId: v.optional(v.id("transcriptTurns")),
  text: v.string(),
  verified: v.boolean(),
})

export const requirementFields = {
  prdId: v.id("prds"),
  projectId: v.id("projects"),
  code: v.string(),
  kind: requirementKindValidator,
  title: v.string(),
  detail: v.string(),
  priority: priorityValidator,
  quotes: v.array(quoteValidator),
}

export const decisionFields = {
  projectId: v.id("projects"),
  prdId: v.optional(v.id("prds")),
  text: v.string(),
  by: v.string(),
  at: v.number(),
}

export const manifestValidator = v.object({
  stack: v.array(v.string()),
  deployTarget: v.string(),
  configure: v.array(v.string()),
  limits: v.array(v.string()),
  monthlyCost: v.object({ freeUsd: v.number(), paidUsd: v.number(), notes: v.string() }),
})

export const templateFields = {
  ownerId: v.id("users"),
  name: v.string(),
  repoUrl: v.string(),
  source: templateSourceValidator,
  manifest: manifestValidator,
  analyzedAt: v.optional(v.number()),
  status: templateStatusValidator,
}

export const verdictFields = {
  projectId: v.id("projects"),
  templateId: v.id("templates"),
  requirementId: v.id("requirements"),
  verdict: verdictValidator,
  hours: v.number(),
  infraMonthlyUsd: v.number(),
  alternative: v.optional(v.string()),
  rationale: v.string(),
}

export const freeTierBreakValidator = v.object({
  service: v.string(),
  limit: v.string(),
  atUsage: v.string(),
  extraUsd: v.number(),
  reason: v.string(),
})

export const estimateFields = {
  projectId: v.id("projects"),
  templateId: v.id("templates"),
  totalHours: v.number(),
  infraMonthlyUsd: v.number(),
  assumptions: v.array(v.string()),
  freeTierBreaks: v.array(freeTierBreakValidator),
  createdAt: v.number(),
}

export const prototypeFields = {
  projectId: v.id("projects"),
  kind: prototypeKindValidator,
  url: v.optional(v.string()),
  fileId: v.optional(v.id("_storage")),
  status: prototypeStatusValidator,
  createdAt: v.number(),
}

export const feedbackItemValidator = v.object({
  kind: feedbackItemKindValidator,
  text: v.string(),
})

export const clientFeedbackFields = {
  projectId: v.id("projects"),
  prototypeId: v.id("prototypes"),
  mode: interviewModeValidator,
  audioFileId: v.optional(v.id("_storage")),
  transcript: v.string(),
  items: v.array(feedbackItemValidator),
  status: clientFeedbackStatusValidator,
  createdAt: v.number(),
}

export const usageFields = {
  day: v.string(),
  kind: usageKindValidator,
  count: v.number(),
}

export const projectContentValidator = v.object({
  project: v.object({
    clientName: v.string(),
    title: v.string(),
  }),
})

export type ProjectContent = Infer<typeof projectContentValidator>

export const MAX_PROJECT_NAME_LENGTH = 200
