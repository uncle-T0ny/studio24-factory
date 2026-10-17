import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { isOwnerEmail, ownerEnv } from "./owners"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

// Who may read and change what. An owner is a signed-in user whose email is on OWNER_EMAILS; she
// works on her own projects. A guest holds a project's share token and works on that project
// only. lib/functions.ts applies these rules to every public function.

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

// The signed-in user, if she is an owner. The allowlist is checked on every call, not only at
// sign-up (auth.ts), so taking an email off OWNER_EMAILS locks that account out at once.
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

// The project a share link opens, or null for an empty or unknown token.
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

// ctx.access (lib/functions.ts): finds a project for the caller, or null; the require* methods
// throw "Not allowed" instead. With a share token the caller is that project's guest and nobody
// else, even when an owner is signed in; without one she is the signed-in owner. The
// *OwnedProject methods refuse a guest. A resource that belongs to a project (a project's tasks,
// files, ...) gets its own find/require pair here that checks its project with findProject.
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

  // Looked up once per call, however many projects the call checks.
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
