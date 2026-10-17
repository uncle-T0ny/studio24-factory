import { ConvexError, v, type Infer } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { internalMutation, type QueryCtx } from "./_generated/server"
import { clientQuery } from "./lib/functions"
import { prototypeKindValidator } from "./lib/validators"

const NO_SUCH_PROJECT = "No project has this slug."
const NOT_A_LINK = "A prototype's URL starts with https://, http:// or /."

const prototypeViewValidator = v.object({ kind: prototypeKindValidator, url: v.string() })

export const maybePrototypeValidator = v.union(v.null(), prototypeViewValidator)

interface LatestPrototype {
  id: Id<"prototypes">
  view: Infer<typeof prototypeViewValidator>
}

export async function latestPrototype(
  ctx: QueryCtx,
  projectId: Id<"projects">,
): Promise<LatestPrototype | null> {
  const prototype = await ctx.db
    .query("prototypes")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .order("desc")
    .first()

  return prototype?.url === undefined
    ? null
    : { id: prototype._id, view: { kind: prototype.kind, url: prototype.url } }
}

export const registerPrototype = internalMutation({
  args: { slug: v.string(), kind: prototypeKindValidator, url: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (!project) {
      throw new ConvexError(NO_SUCH_PROJECT)
    }

    if (!/^(https?:\/\/|\/)/.test(args.url)) {
      throw new ConvexError(NOT_A_LINK)
    }

    await ctx.db.insert("prototypes", {
      projectId: project._id,
      kind: args.kind,
      url: args.url,
      status: "ready",
      createdAt: Date.now(),
    })

    return null
  },
})

export const forClient = clientQuery("prototype")({
  args: {},
  returns: maybePrototypeValidator,
  handler: async (ctx) => (await latestPrototype(ctx, ctx.client.project._id))?.view ?? null,
})
