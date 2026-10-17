import { ConvexError, v, type Infer } from "convex/values"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import {
  internalAction,
  internalMutation,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"
import { clientQuery } from "./lib/functions"
import { prototypeKindValidator } from "./lib/validators"

const NO_SUCH_PROJECT = "No project has this slug."
const NOT_A_LINK = "A prototype's URL starts with https:// or http://."

const prototypeViewValidator = v.object({ kind: prototypeKindValidator, url: v.string() })

export const maybePrototypeValidator = v.union(v.null(), prototypeViewValidator)

interface LatestPrototype {
  id: Id<"prototypes">
  view: Infer<typeof prototypeViewValidator>
}

type PrototypeSource = { url: string } | { fileId: Id<"_storage"> }

export async function latestPrototype(
  ctx: QueryCtx,
  projectId: Id<"projects">,
): Promise<LatestPrototype | null> {
  const prototype = await ctx.db
    .query("prototypes")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .order("desc")
    .first()

  if (!prototype) {
    return null
  }

  const url =
    prototype.url ??
    (prototype.fileId === undefined ? null : await ctx.storage.getUrl(prototype.fileId))

  return url === null ? null : { id: prototype._id, view: { kind: prototype.kind, url } }
}

async function insertPrototype(
  ctx: MutationCtx,
  slug: string,
  kind: Infer<typeof prototypeKindValidator>,
  source: PrototypeSource,
): Promise<void> {
  const project = await ctx.db
    .query("projects")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first()

  if (!project) {
    throw new ConvexError(NO_SUCH_PROJECT)
  }

  await ctx.db.insert("prototypes", {
    projectId: project._id,
    kind,
    status: "ready",
    createdAt: Date.now(),
    ...source,
  })
}

export const registerPrototype = internalMutation({
  args: { slug: v.string(), kind: prototypeKindValidator, url: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!/^https?:\/\//.test(args.url)) {
      throw new ConvexError(NOT_A_LINK)
    }

    await insertPrototype(ctx, args.slug, args.kind, { url: args.url })

    return null
  },
})

export const saveMockup = internalMutation({
  args: { slug: v.string(), fileId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await insertPrototype(ctx, args.slug, "mockup", { fileId: args.fileId })

    return null
  },
})

export const uploadMockup = internalAction({
  args: { slug: v.string(), html: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const fileId = await ctx.storage.store(new Blob([args.html], { type: "text/html" }))

    try {
      await ctx.runMutation(internal.prototypes.saveMockup, { slug: args.slug, fileId })
    } catch (error) {
      await ctx.storage.delete(fileId)
      throw error
    }

    return null
  },
})

export const forClient = clientQuery("prototype")({
  args: {},
  returns: maybePrototypeValidator,
  handler: async (ctx) => (await latestPrototype(ctx, ctx.client.project._id))?.view ?? null,
})
