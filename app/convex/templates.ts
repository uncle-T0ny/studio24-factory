import { v } from "convex/values"
import { internal } from "./_generated/api"
import { type Id } from "./_generated/dataModel"
import { action, internalMutation, internalQuery } from "./_generated/server"
import { requireOwner } from "./lib/access"
import { manifestFromLink } from "./lib/analysis"
import { ownerQuery } from "./lib/functions"
import { askCounted } from "./lib/llmUsage"
import { templateFields } from "./lib/validators"

export const listMine = ownerQuery({
  args: {},
  handler: async (ctx) =>
    await ctx.db
      .query("templates")
      .withIndex("by_owner", (q) => q.eq("ownerId", ctx.ownerId))
      .order("desc")
      .collect(),
})

export const owner = internalQuery({
  args: {},
  handler: async (ctx) => await requireOwner(ctx),
})

export const insert = internalMutation({
  args: templateFields,
  handler: async (ctx, template) => await ctx.db.insert("templates", template),
})

export const addByLink = action({
  args: { repoUrl: v.string() },
  handler: async (
    ctx,
    { repoUrl },
  ): Promise<{ templateId: Id<"templates">; problem: string | null }> => {
    const ownerId = await ctx.runQuery(internal.templates.owner, {})
    const { source, manifest, problem } = await manifestFromLink(repoUrl, askCounted(ctx))
    const templateId = await ctx.runMutation(internal.templates.insert, {
      ownerId,
      name: repoUrl.trim().replace(/^https:\/\/github\.com\//, ""),
      repoUrl: repoUrl.trim(),
      source,
      manifest,
      analyzedAt: Date.now(),
      status: "ready",
    })

    return { templateId, problem }
  },
})
