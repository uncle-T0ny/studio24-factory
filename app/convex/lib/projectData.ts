import type { Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"

export const PROJECT_SCOPED_TABLES = [
  "stageEvents",
  "clientLinks",
  "interviews",
  "transcriptTurns",
  "prds",
  "requirements",
  "decisions",
  "verdicts",
  "estimates",
  "prototypes",
  "clientFeedback",
]

export async function deleteProjectData(
  ctx: MutationCtx,
  projectId: Id<"projects">,
): Promise<void> {
  const rows = [
    ...(await ctx.db
      .query("stageEvents")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()),
    ...(await ctx.db
      .query("clientLinks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()),
    ...(await ctx.db
      .query("interviews")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()),
    ...(await ctx.db
      .query("transcriptTurns")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()),
    ...(await ctx.db
      .query("prds")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()),
    ...(await ctx.db
      .query("requirements")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()),
    ...(await ctx.db
      .query("decisions")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()),
    ...(await ctx.db
      .query("verdicts")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()),
    ...(await ctx.db
      .query("estimates")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect()),
  ]
  const prototypes = await ctx.db
    .query("prototypes")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect()
  const clientFeedback = await ctx.db
    .query("clientFeedback")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect()
  const files = [
    ...prototypes.map((prototype) => prototype.fileId),
    ...clientFeedback.map((feedback) => feedback.audioFileId),
  ]

  for (const fileId of files) {
    if (fileId) {
      await ctx.storage.delete(fileId)
    }
  }

  for (const row of [...rows, ...prototypes, ...clientFeedback]) {
    await ctx.db.delete(row._id)
  }
}
