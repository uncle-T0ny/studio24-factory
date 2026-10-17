import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { feedbackFields } from "./lib/feedback"
import { projectFields } from "./lib/validators"
import { voiceSessionFields, voiceTranscriptFields, voiceUsageFields } from "./lib/voice"

export default defineSchema({
  ...authTables,

  projects: defineTable(projectFields)
    .index("by_owner", ["ownerId"])
    .index("by_shareToken", ["shareToken"]),

  feedback: defineTable(feedbackFields)
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status", "createdAt"])
    .index("by_owner", ["ownerId"]),

  // The optional voice module (lib/voice.ts). Remove these three with it.
  voiceSessions: defineTable(voiceSessionFields)
    .index("by_owner", ["ownerId"])
    .index("by_project", ["projectId"])
    .index("by_roomName", ["roomName"]),

  voiceTranscripts: defineTable(voiceTranscriptFields)
    .index("by_owner", ["ownerId"])
    .index("by_project", ["projectId", "at"])
    .index("by_session", ["sessionId", "index"]),

  voiceUsage: defineTable(voiceUsageFields).index("by_day", ["day"]),
})
