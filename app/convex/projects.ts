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
