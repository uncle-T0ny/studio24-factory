import { v } from "convex/values"
import { ownerMutation, ownerQuery } from "./lib/functions"
import { insertProject } from "./lib/projects"
import { projectContentValidator } from "./lib/validators"

export const exportProject = ownerQuery({
  args: {
    projectId: v.id("projects"),
  },
  returns: projectContentValidator,
  handler: async (ctx, args) => {
    const { clientName, title } = await ctx.requireProject(args.projectId)

    return { project: { clientName, title } }
  },
})

export const importProject = ownerMutation({
  args: projectContentValidator,
  returns: v.id("projects"),
  handler: async (ctx, args) => await insertProject(ctx, ctx.ownerId, args.project),
})
