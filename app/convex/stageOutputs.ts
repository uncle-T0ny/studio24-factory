import { v } from "convex/values"
import { ownerQuery } from "./lib/functions"
import { feedbackItemValidator, prototypeKindValidator, speakerValidator } from "./lib/validators"
import { interviewTurns } from "./lib/voiceData"
import { latestPrototype } from "./prototypes"

const PREVIEW_TURNS = 3

export const forProject = ownerQuery({
  args: { projectId: v.id("projects") },
  returns: v.object({
    turns: v.array(v.object({ seq: v.number(), speaker: speakerValidator, text: v.string() })),
    prd: v.union(v.null(), v.object({ frCount: v.number(), titles: v.array(v.string()) })),
    estimate: v.union(v.null(), v.object({ hours: v.number(), monthlyUsd: v.number() })),
    prototype: v.union(v.null(), v.object({ kind: prototypeKindValidator, url: v.string() })),
    feedback: v.array(feedbackItemValidator),
  }),
  handler: async (ctx, { projectId }) => {
    await ctx.requireProject(projectId)
    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .first()
    const prd = await ctx.db
      .query("prds")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .first()
    const frs = prd
      ? (
          await ctx.db
            .query("requirements")
            .withIndex("by_prd", (q) => q.eq("prdId", prd._id))
            .collect()
        ).filter((requirement) => requirement.kind === "FR")
      : []
    const estimate = await ctx.db
      .query("estimates")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .first()
    const feedback = await ctx.db
      .query("clientFeedback")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .first()

    return {
      turns: interview ? (await interviewTurns(ctx, interview._id)).slice(0, PREVIEW_TURNS) : [],
      prd: prd ? { frCount: frs.length, titles: frs.slice(0, 3).map((fr) => fr.title) } : null,
      estimate: estimate
        ? { hours: estimate.totalHours, monthlyUsd: estimate.infraMonthlyUsd }
        : null,
      prototype: (await latestPrototype(ctx, projectId))?.view ?? null,
      feedback: feedback?.items ?? [],
    }
  },
})
