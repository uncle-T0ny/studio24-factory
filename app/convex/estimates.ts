import { ConvexError, v } from "convex/values"
import { omit } from "convex-helpers"
import { internal } from "./_generated/api"
import { action, internalMutation, internalQuery } from "./_generated/server"
import { requireClientStage } from "./lib/access"
import { analyse, estimateTotals } from "./lib/analysis"
import { clientQuery } from "./lib/functions"
import { askCounted } from "./lib/llmUsage"
import { SEEDED_TEMPLATE } from "./lib/seededTemplate"
import { estimateFields, verdictFields } from "./lib/validators"

export const analysisInput = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { project } = await requireClientStage(ctx, token, "analysis")
    const prd = await ctx.db
      .query("prds")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .order("desc")
      .first()
    const requirements = prd
      ? await ctx.db
          .query("requirements")
          .withIndex("by_prd", (q) => q.eq("prdId", prd._id))
          .collect()
      : []
    const template = await ctx.db
      .query("templates")
      .withIndex("by_owner", (q) => q.eq("ownerId", project.ownerId))
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "ready"))
      .first()

    return { projectId: project._id, ownerId: project.ownerId, requirements, template }
  },
})

export const save = internalMutation({
  args: {
    verdicts: v.array(v.object(omit(verdictFields, ["projectId", "templateId"]))),
    estimate: v.object(omit(estimateFields, ["createdAt"])),
  },
  handler: async (ctx, { verdicts, estimate }) => {
    const { projectId, templateId } = estimate
    const previous = await ctx.db
      .query("verdicts")
      .withIndex("by_project", (q) => q.eq("projectId", projectId).eq("templateId", templateId))
      .collect()

    for (const verdict of previous) {
      await ctx.db.delete(verdict._id)
    }
    for (const verdict of verdicts) {
      await ctx.db.insert("verdicts", { ...verdict, projectId, templateId })
    }
    await ctx.db.insert("estimates", { ...estimate, createdAt: Date.now() })
  },
})

export const run = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<null> => {
    const input = await ctx.runQuery(internal.estimates.analysisInput, { token })

    if (input.requirements.length === 0) {
      throw new ConvexError("Draft the PRD first.")
    }
    const templateId =
      input.template?._id ??
      (await ctx.runMutation(internal.templates.insert, {
        ...SEEDED_TEMPLATE,
        ownerId: input.ownerId,
        source: "seeded",
        status: "ready",
      }))
    const manifest = input.template?.manifest ?? SEEDED_TEMPLATE.manifest
    const requirements = input.requirements.map(({ code, kind, title, detail, priority }) => ({
      code,
      kind,
      title,
      detail,
      priority,
    }))
    const { answer, problems } = await analyse(manifest, requirements, askCounted(ctx))

    if (answer === null || problems.length > 0) {
      throw new ConvexError(`The analysis came back invalid twice: ${problems.join(" ")}`)
    }
    const verdicts = answer.verdicts.flatMap(({ code, ...verdict }) =>
      input.requirements
        .filter((requirement) => requirement.code === code)
        .map((requirement) => ({ ...verdict, requirementId: requirement._id })),
    )

    await ctx.runMutation(internal.estimates.save, {
      verdicts,
      estimate: {
        projectId: input.projectId,
        templateId,
        assumptions: answer.assumptions,
        freeTierBreaks: answer.freeTierBreaks,
        ...estimateTotals(answer.verdicts, manifest),
      },
    })
    return null
  },
})

export const forClient = clientQuery("analysis")({
  args: {},
  handler: async (ctx) => {
    const estimates = await ctx.db
      .query("estimates")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.client.project._id))
      .collect()
    const estimate = estimates.sort((a, b) => b.createdAt - a.createdAt)[0]

    if (!estimate) {
      return null
    }
    const template = await ctx.db.get(estimate.templateId)
    const verdicts = await ctx.db
      .query("verdicts")
      .withIndex("by_project", (q) =>
        q.eq("projectId", estimate.projectId).eq("templateId", estimate.templateId),
      )
      .collect()
    const rows = await Promise.all(
      verdicts.map(async (verdict) => ({
        ...verdict,
        requirement: await ctx.db.get(verdict.requirementId),
      })),
    )

    // Estimates keep no model name; the deployment's key tells whether its answers are recorded.
    const recorded = !process.env.OPENROUTER_API_KEY
    return { estimate, templateName: template?.name ?? "", verdicts: rows, recorded }
  },
})
