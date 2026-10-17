import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions"
import { accessArgs, accessFor, requireOwner } from "./access"
import { mutation, query } from "../_generated/server"

export const ownerQuery = customQuery(
  query,
  customCtx(async (ctx) => ({
    ownerId: await requireOwner(ctx),
    access: accessFor(ctx, undefined),
  })),
)

export const ownerMutation = customMutation(
  mutation,
  customCtx(async (ctx) => ({
    ownerId: await requireOwner(ctx),
    access: accessFor(ctx, undefined),
  })),
)

export const projectQuery = customQuery(query, {
  args: accessArgs,
  input: (ctx, { shareToken }) => ({
    ctx: {
      access: accessFor(ctx, shareToken),
    },
    args: {},
  }),
})

export const projectMutation = customMutation(mutation, {
  args: accessArgs,
  input: (ctx, { shareToken }) => ({
    ctx: {
      access: accessFor(ctx, shareToken),
    },
    args: {},
  }),
})

export const publicQuery = query
