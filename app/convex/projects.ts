import { v } from "convex/values"
import { findSharedProject } from "./lib/access"
import {
  ownerMutation,
  ownerQuery,
  projectMutation,
  projectQuery,
  publicQuery,
} from "./lib/functions"
import { cleanProjectName, sharedProjectValidator } from "./lib/projects"
import { newShareToken } from "./lib/shareToken"
import { deleteProjectVoiceData } from "./lib/voiceData"
import schema from "./schema"

// The example resource: an owner's projects, each with a share link (/p/<token>) that lets a
// guest open and rename that one project, with no account.

export const create = ownerMutation({
  args: {
    name: v.string(),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) =>
    await ctx.db.insert("projects", {
      ownerId: ctx.ownerId,
      name: cleanProjectName(args.name),
      shareToken: newShareToken(),
    }),
})

export const listMine = ownerQuery({
  args: {},
  returns: v.array(schema.doc("projects")),
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", ctx.ownerId))
      .collect()

    return projects.sort((a, b) => b._creationTime - a._creationTime)
  },
})

// The owner's own project, or null for any other caller or a malformed id.
export const get = projectQuery({
  args: {
    projectId: v.string(),
  },
  returns: v.union(schema.doc("projects"), v.null()),
  handler: async (ctx, args) => {
    const projectId = ctx.db.normalizeId("projects", args.projectId)

    if (projectId === null) {
      return null
    }

    const access = await ctx.access.findOwnedProject(projectId)

    return access?.project ?? null
  },
})

// The share link: anyone with the token may open the project, without its owner's id.
export const getByShareToken = publicQuery({
  args: {
    shareToken: v.string(),
  },
  returns: v.union(sharedProjectValidator, v.null()),
  handler: async (ctx, args) => {
    const project = await findSharedProject(ctx, args.shareToken)

    if (!project) {
      return null
    }

    const { ownerId, ...shared } = project

    return shared
  },
})

// The owner, or a guest with the project's share token.
export const rename = projectMutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { project } = await ctx.access.requireProject(args.projectId)

    await ctx.db.patch(project._id, {
      name: cleanProjectName(args.name),
    })

    return null
  },
})

export const remove = ownerMutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { project } = await ctx.access.requireOwnedProject(args.projectId)

    await deleteProjectVoiceData(ctx, project._id)
    await ctx.db.delete(project._id)

    return null
  },
})
