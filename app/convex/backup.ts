import { v } from "convex/values"
import { ownerMutation, ownerQuery } from "./lib/functions"
import { cleanProjectName } from "./lib/projects"
import { newShareToken } from "./lib/shareToken"
import { projectContentValidator } from "./lib/validators"

export const exportProject = ownerQuery({
  args: {
    projectId: v.id("projects"),
  },
  returns: projectContentValidator,
  handler: async (ctx, args) => {
    const { project } = await ctx.access.requireOwnedProject(args.projectId)

    return {
      project: {
        name: project.name,
      },
    }
  },
})

export const importProject = ownerMutation({
  args: projectContentValidator,
  returns: v.id("projects"),
  handler: async (ctx, args) =>
    await ctx.db.insert("projects", {
      ownerId: ctx.ownerId,
      name: cleanProjectName(args.project.name),
      shareToken: newShareToken(),
    }),
})
