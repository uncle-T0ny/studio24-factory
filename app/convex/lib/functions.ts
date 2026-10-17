import { v } from "convex/values"
import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions"
import { requireClientStage, requireOwnedProject, requireOwner, type ReadCtx } from "./access"
import type { Stage } from "./validators"
import type { Id } from "../_generated/dataModel"
import { mutation, query } from "../_generated/server"

async function ownerCtx(ctx: ReadCtx) {
  const ownerId = await requireOwner(ctx)

  return {
    ownerId,
    requireProject: (projectId: Id<"projects">) => requireOwnedProject(ctx, ownerId, projectId),
  }
}

export const ownerQuery = customQuery(query, customCtx(ownerCtx))

export const ownerMutation = customMutation(mutation, customCtx(ownerCtx))

const clientArgs = { token: v.string() }

export function clientQuery(stage: Stage) {
  return customQuery(query, {
    args: clientArgs,
    input: async (ctx, { token }) => ({
      ctx: { client: await requireClientStage(ctx, token, stage) },
      args: {},
    }),
  })
}

export function clientMutation(stage: Stage) {
  return customMutation(mutation, {
    args: clientArgs,
    input: async (ctx, { token }) => ({
      ctx: { client: await requireClientStage(ctx, token, stage) },
      args: {},
    }),
  })
}

export const publicQuery = query
