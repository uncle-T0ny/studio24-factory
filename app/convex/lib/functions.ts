import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions"
import { accessArgs, accessFor, requireOwner } from "./access"
import { mutation, query } from "../_generated/server"

// Every public function is declared with one of these builders, so none can skip the access
// rules in lib/access.ts. Function files don't import query or mutation from _generated/server.

// A signed-in owner, or "Not allowed". ctx.ownerId is hers, and ctx.access finds her own
// projects.
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

// The owner, or a guest with the project's share token. They take the optional `shareToken`
// arg and add ctx.access, which checks it; the handler doesn't see the token.
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

// No access rule, for the functions anyone may call: accounts.status before sign-in, and
// projects.getByShareToken, which opens only the project its token names.
export const publicQuery = query
