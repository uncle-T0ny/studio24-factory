import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { feedbackFields } from "./lib/feedback"
import {
  clientFeedbackFields,
  clientLinkFields,
  decisionFields,
  estimateFields,
  interviewFields,
  prdFields,
  projectFields,
  prototypeFields,
  requirementFields,
  stageEventFields,
  templateFields,
  transcriptTurnFields,
  usageFields,
  verdictFields,
} from "./lib/validators"

export default defineSchema({
  ...authTables,

  projects: defineTable(projectFields).index("by_owner", ["ownerId"]).index("by_slug", ["slug"]),

  stageEvents: defineTable(stageEventFields).index("by_project", ["projectId", "stage"]),

  clientLinks: defineTable(clientLinkFields)
    .index("by_project", ["projectId"])
    .index("by_tokenHash", ["tokenHash"]),

  interviews: defineTable(interviewFields)
    .index("by_project", ["projectId"])
    .index("by_link", ["linkId"])
    .index("by_roomName", ["roomName"]),

  transcriptTurns: defineTable(transcriptTurnFields)
    .index("by_interview", ["interviewId", "seq"])
    .index("by_project", ["projectId", "at"]),

  prds: defineTable(prdFields).index("by_project", ["projectId", "version"]),

  requirements: defineTable(requirementFields)
    .index("by_prd", ["prdId"])
    .index("by_project", ["projectId"]),

  decisions: defineTable(decisionFields).index("by_project", ["projectId"]),

  templates: defineTable(templateFields).index("by_owner", ["ownerId"]),

  verdicts: defineTable(verdictFields)
    .index("by_project", ["projectId", "templateId"])
    .index("by_requirement", ["requirementId"]),

  estimates: defineTable(estimateFields).index("by_project", ["projectId", "templateId"]),

  prototypes: defineTable(prototypeFields).index("by_project", ["projectId"]),

  clientFeedback: defineTable(clientFeedbackFields)
    .index("by_project", ["projectId"])
    .index("by_prototype", ["prototypeId"]),

  usage: defineTable(usageFields).index("by_day", ["day", "kind"]),

  feedback: defineTable(feedbackFields)
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status", "createdAt"])
    .index("by_owner", ["ownerId"]),
})
