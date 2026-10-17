import { ConvexError } from "convex/values"
import { MAX_PROJECT_NAME_LENGTH } from "./validators"
import type { Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"

interface NewProject {
  clientName: string
  title: string
  slug?: string
  isDemo?: boolean
}

export function cleanProjectName(name: string): string {
  const cleaned = name.trim()

  if (cleaned.length === 0) {
    throw new ConvexError("A project needs a name.")
  }

  if (cleaned.length > MAX_PROJECT_NAME_LENGTH) {
    throw new ConvexError(`Keep the name under ${MAX_PROJECT_NAME_LENGTH} characters.`)
  }

  return cleaned
}

export function slugOf(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug.length > 0 ? slug : "client"
}

async function freeSlug(ctx: MutationCtx, wanted: string): Promise<string> {
  for (let n = 1; ; n += 1) {
    const slug = n === 1 ? wanted : `${wanted}-${n}`
    const taken = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first()

    if (!taken) {
      return slug
    }
  }
}

export async function insertProject(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  project: NewProject,
): Promise<Id<"projects">> {
  const clientName = cleanProjectName(project.clientName)

  return await ctx.db.insert("projects", {
    ownerId,
    clientName,
    title: cleanProjectName(project.title),
    slug: await freeSlug(ctx, project.slug ?? slugOf(clientName)),
    stage: "interview",
    isDemo: project.isDemo ?? false,
    createdAt: Date.now(),
  })
}
