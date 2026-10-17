import { v } from "convex/values"
import { ownerMutation, ownerQuery } from "./lib/functions"
import { deleteProjectData } from "./lib/projectData"
import { insertProject } from "./lib/projects"
import schema from "./schema"

export const create = ownerMutation({
  args: {
    clientName: v.string(),
    title: v.string(),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => await insertProject(ctx, ctx.ownerId, args),
})

export const listMine = ownerQuery({
  args: {},
  returns: v.array(schema.doc("projects")),
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", ctx.ownerId))
      .collect()

    return projects.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const get = ownerQuery({
  args: {
    projectId: v.string(),
  },
  returns: v.union(schema.doc("projects"), v.null()),
  handler: async (ctx, args) => {
    const projectId = ctx.db.normalizeId("projects", args.projectId)
    const project = projectId === null ? null : await ctx.db.get(projectId)

    return project?.ownerId === ctx.ownerId ? project : null
  },
})

export const remove = ownerMutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.requireProject(args.projectId)

    await deleteProjectData(ctx, project._id)
    await ctx.db.delete(project._id)

    return null
  },
})
