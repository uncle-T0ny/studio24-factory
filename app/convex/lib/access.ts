import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { isOwnerEmail, ownerEnv } from "./owners"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

export type ReadCtx = QueryCtx | MutationCtx

export enum Actor {
  Owner = "owner",
  Guest = "guest",
}

export interface ProjectAccess {
  project: Doc<"projects">
  actor: Actor
}

export const accessArgs = {
  shareToken: v.optional(v.string()),
}

const NOT_ALLOWED = "Not allowed"

export async function findOwner(ctx: ReadCtx): Promise<Id<"users"> | null> {
  const userId = await getAuthUserId(ctx)

  if (userId === null) {
    return null
  }

  const user = await ctx.db.get(userId)
  const isOwner = user?.email !== undefined && isOwnerEmail(user.email, ownerEnv())

  return isOwner ? userId : null
}

export async function requireOwner(ctx: ReadCtx): Promise<Id<"users">> {
  return allowed(await findOwner(ctx))
}

export async function findSharedProject(
  ctx: ReadCtx,
  shareToken: string,
): Promise<Doc<"projects"> | null> {
  if (shareToken.length === 0) {
    return null
  }

  return await ctx.db
    .query("projects")
    .withIndex("by_shareToken", (q) => q.eq("shareToken", shareToken))
    .unique()
}

export interface Access {
  findProject(projectId: Id<"projects">): Promise<ProjectAccess | null>
  requireProject(projectId: Id<"projects">): Promise<ProjectAccess>
  findOwnedProject(projectId: Id<"projects">): Promise<ProjectAccess | null>
  requireOwnedProject(projectId: Id<"projects">): Promise<ProjectAccess>
}

function allowed<T>(access: T | null): T {
  if (access === null) {
    throw new ConvexError(NOT_ALLOWED)
  }

  return access
}

export function accessFor(ctx: ReadCtx, shareToken: string | undefined): Access {
  let owner: Promise<Id<"users"> | null> | undefined

  const ownerOnce = () => {
    owner ??= findOwner(ctx)

    return owner
  }

  const findProject = async (projectId: Id<"projects">): Promise<ProjectAccess | null> => {
    const project = await ctx.db.get(projectId)

    if (!project) {
      return null
    }

    if (shareToken !== undefined) {
      const isTokenValid = shareToken.length > 0 && shareToken === project.shareToken

      return isTokenValid ? { project, actor: Actor.Guest } : null
    }

    const isOwnProject = (await ownerOnce()) === project.ownerId

    return isOwnProject ? { project, actor: Actor.Owner } : null
  }

  const findOwnedProject = async (projectId: Id<"projects">): Promise<ProjectAccess | null> => {
    const access = await findProject(projectId)

    return access?.actor === Actor.Owner ? access : null
  }

  return {
    findProject,
    requireProject: async (projectId) => allowed(await findProject(projectId)),
    findOwnedProject,
    requireOwnedProject: async (projectId) => allowed(await findOwnedProject(projectId)),
  }
}
