import { ConvexError, v } from "convex/values"
import { findClientAccess, NOT_ALLOWED } from "./lib/access"
import { insertClientLink } from "./lib/clientLinks"
import { clientQuery, ownerMutation, ownerQuery, publicQuery } from "./lib/functions"
import { stageValidator } from "./lib/validators"
import schema from "./schema"

export const listForProject = ownerQuery({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(schema.doc("clientLinks")),
  handler: async (ctx, args) => {
    await ctx.requireProject(args.projectId)

    return await ctx.db
      .query("clientLinks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect()
  },
})

export const create = ownerMutation({
  args: {
    projectId: v.id("projects"),
    stage: stageValidator,
  },
  returns: v.object({ linkId: v.id("clientLinks"), token: v.string() }),
  handler: async (ctx, args) => {
    await ctx.requireProject(args.projectId)

    return await insertClientLink(ctx, args.projectId, [args.stage])
  },
})

export const revoke = ownerMutation({
  args: {
    linkId: v.id("clientLinks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId)

    if (!link) {
      throw new ConvexError(NOT_ALLOWED)
    }

    await ctx.requireProject(link.projectId)
    await ctx.db.patch(link._id, { revokedAt: Date.now() })

    return null
  },
})

export const open = publicQuery({
  args: {
    token: v.string(),
  },
  returns: v.union(v.object({ stage: stageValidator, stages: v.array(stageValidator) }), v.null()),
  handler: async (ctx, args) => {
    const access = await findClientAccess(ctx, args.token)

    return access && { stage: access.project.stage, stages: access.link.stages }
  },
})

export const finalApp = clientQuery("final")({
  args: {},
  returns: v.object({ title: v.string() }),
  handler: (ctx) => ({ title: ctx.client.project.title }),
})
