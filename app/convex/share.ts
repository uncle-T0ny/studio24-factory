import { v } from "convex/values"
import { projectMutation } from "./lib/functions"
import { newShareToken } from "./lib/shareToken"

export const regenerate = projectMutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const access = await ctx.access.requireOwnedProject(args.projectId)
    const shareToken = newShareToken()

    await ctx.db.patch(access.project._id, {
      shareToken,
    })

    return shareToken
  },
})
