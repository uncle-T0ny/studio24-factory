import { ConvexError, v } from "convex/values"
import { omit } from "convex-helpers"
import { internal } from "./_generated/api"
import { action, internalMutation, internalQuery } from "./_generated/server"
import { requireClientStage } from "./lib/access"
import { clientQuery } from "./lib/functions"
import { RECORDED_MODEL } from "./lib/llm"
import { askCounted } from "./lib/llmUsage"
import { draftPrd, verifyQuote } from "./lib/prd"
import { requirementFields } from "./lib/validators"

const requirementAnswerFields = omit(requirementFields, ["prdId", "projectId"])

export const draftInput = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { project } = await requireClientStage(ctx, token, "prd")
    const turns = await ctx.db
      .query("transcriptTurns")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect()

    // Numbered across the project's interviews, so a quote's turn number names one turn.
    return {
      projectId: project._id,
      turns: turns.map((turn, index) => ({ ...turn, seq: index + 1 })),
    }
  },
})

export const save = internalMutation({
  args: {
    projectId: v.id("projects"),
    model: v.string(),
    problems: v.array(v.string()),
    summary: v.string(),
    outOfScope: v.array(v.string()),
    decisions: v.array(v.string()),
    requirements: v.array(v.object(requirementAnswerFields)),
  },
  handler: async (ctx, { projectId, problems, requirements, decisions, ...prd }) => {
    const latest = await ctx.db
      .query("prds")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .first()
    const now = Date.now()
    const prdId = await ctx.db.insert("prds", {
      ...prd,
      projectId,
      version: (latest?.version ?? 0) + 1,
      status: "draft",
      validation: { ok: problems.length === 0, problems },
      createdAt: now,
    })

    for (const requirement of requirements) {
      await ctx.db.insert("requirements", { ...requirement, prdId, projectId })
    }
    for (const text of decisions) {
      await ctx.db.insert("decisions", { projectId, prdId, text, by: "client", at: now })
    }
  },
})

export const draft = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { projectId, turns } = await ctx.runQuery(internal.prd.draftInput, { token })

    if (!turns.some((turn) => turn.speaker === "client")) {
      throw new ConvexError("The interview has no answers yet.")
    }
    const { answer, problems, model } = await draftPrd(turns, askCounted(ctx))

    await ctx.runMutation(internal.prd.save, {
      projectId,
      model,
      problems,
      summary: answer?.summary ?? "",
      outOfScope: answer?.outOfScope ?? [],
      decisions: answer?.decisions ?? [],
      requirements: (answer?.requirements ?? []).map(({ quotes, ...requirement }) => ({
        ...requirement,
        quotes: quotes.map((quote) => verifyQuote(quote, turns)),
      })),
    })
  },
})

export const forClient = clientQuery("prd")({
  args: {},
  handler: async (ctx) => {
    const prd = await ctx.db
      .query("prds")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.client.project._id))
      .order("desc")
      .first()

    if (!prd) {
      return null
    }
    const requirements = await ctx.db
      .query("requirements")
      .withIndex("by_prd", (q) => q.eq("prdId", prd._id))
      .collect()
    const decisions = await ctx.db
      .query("decisions")
      .withIndex("by_project", (q) => q.eq("projectId", prd.projectId))
      .filter((q) => q.eq(q.field("prdId"), prd._id))
      .collect()

    return { prd, requirements, decisions, recorded: prd.model === RECORDED_MODEL }
  },
})
