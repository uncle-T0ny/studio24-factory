import { ConvexError, v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { internalMutation, type MutationCtx } from "./_generated/server"
import { ownerMutation, ownerQuery } from "./lib/functions"
import { deleteProjectData } from "./lib/projectData"
import { insertProject } from "./lib/projects"
import { STAGES, stageValidator, type Stage } from "./lib/validators"
import schema from "./schema"

function statusAt(stage: Stage, current: Stage) {
  const position = STAGES.indexOf(stage) - STAGES.indexOf(current)

  return position < 0 ? "done" : position === 0 ? "active" : "pending"
}

async function moveToStage(ctx: MutationCtx, project: Doc<"projects">, stage: Stage) {
  const now = Date.now()
  const events = await ctx.db
    .query("stageEvents")
    .withIndex("by_project", (q) => q.eq("projectId", project._id))
    .collect()

  for (const each of STAGES) {
    const status = statusAt(each, stage)
    const event = events.find((row) => row.stage === each)
    const startedAt = status === "pending" ? undefined : (event?.startedAt ?? now)
    const doneAt = status === "done" ? (event?.doneAt ?? now) : undefined

    if (event) {
      await ctx.db.patch(event._id, { status, startedAt, doneAt })
    } else if (status !== "pending") {
      await ctx.db.insert("stageEvents", {
        projectId: project._id,
        stage: each,
        status,
        startedAt,
        doneAt,
      })
    }
  }

  await ctx.db.patch(project._id, { stage })
}

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

export const setStage = internalMutation({
  args: {
    slug: v.string(),
    stage: stageValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique()

    if (!project) {
      throw new ConvexError(`No project with slug ${args.slug}`)
    }

    await moveToStage(ctx, project, args.stage)

    return null
  },
})
