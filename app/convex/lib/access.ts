import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError } from "convex/values"
import { isOwnerEmail, ownerEnv } from "./owners"
import { hashToken } from "./shareToken"
import { STAGES, type Stage } from "./validators"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

export type ReadCtx = QueryCtx | MutationCtx

export interface ClientAccess {
  link: Doc<"clientLinks">
  project: Doc<"projects">
}

export const NOT_ALLOWED = "Not allowed"
export const LINK_NOT_VALID = "This link isn't valid any more. Ask the developer for a new one."
export const WRONG_STAGE = "This link doesn't open this stage."
export const SIGN_IN_FIRST = "Sign in to open this stage."

export function notAtStage(current: Stage): string {
  return `This stage isn't open: the project is at the ${current} stage now.`
}

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
  const ownerId = await findOwner(ctx)

  if (ownerId === null) {
    throw new ConvexError(NOT_ALLOWED)
  }

  return ownerId
}

export async function findOwnedProject(
  ctx: ReadCtx,
  ownerId: Id<"users">,
  projectId: Id<"projects">,
): Promise<Doc<"projects"> | null> {
  const project = await ctx.db.get(projectId)

  return project?.ownerId === ownerId ? project : null
}

export async function requireOwnedProject(
  ctx: ReadCtx,
  ownerId: Id<"users">,
  projectId: Id<"projects">,
): Promise<Doc<"projects">> {
  const project = await findOwnedProject(ctx, ownerId, projectId)

  if (!project) {
    throw new ConvexError(NOT_ALLOWED)
  }

  return project
}

export async function findClientAccess(ctx: ReadCtx, token: string): Promise<ClientAccess | null> {
  if (token.length === 0) {
    return null
  }

  const tokenHash = await hashToken(token)
  const link = await ctx.db
    .query("clientLinks")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .unique()
  const isLive =
    link !== null &&
    link.revokedAt === undefined &&
    (link.expiresAt === undefined || link.expiresAt > Date.now())
  const project = isLive ? await ctx.db.get(link.projectId) : null

  return isLive && project ? { link, project } : null
}

export async function requireClientStage(
  ctx: ReadCtx,
  token: string,
  stage: Stage,
): Promise<ClientAccess> {
  const access = await findClientAccess(ctx, token)

  if (!access) {
    throw new ConvexError(LINK_NOT_VALID)
  }

  if (!access.link.stages.includes(stage)) {
    throw new ConvexError(WRONG_STAGE)
  }

  if (STAGES.indexOf(stage) > STAGES.indexOf(access.project.stage)) {
    throw new ConvexError(notAtStage(access.project.stage))
  }

  if (access.link.requiresLogin && (await getAuthUserId(ctx)) === null) {
    throw new ConvexError(SIGN_IN_FIRST)
  }

  return access
}
