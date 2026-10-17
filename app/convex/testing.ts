import { ConvexError, v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { internalMutation, type MutationCtx } from "./_generated/server"
import { deleteOwnerData } from "./lib/ownerData"
import { areTestFunctionsAllowed, isTestOwnerEmail, testOwnerEmail } from "./lib/owners"
import { newShareToken } from "./lib/shareToken"

// Internal functions for the e2e suite and the prove scripts. Each caller uses its own test owner
// (test-owner+<suffix>@example.com), and every function throws unless the deployment sets
// ALLOW_TEST_FUNCTIONS=true (dev and the e2e backend; never prod).

const TEST_FUNCTIONS_OFF =
  "Test functions are off on this deployment: they run only where ALLOW_TEST_FUNCTIONS=true (dev)."
const NOT_A_TEST_OWNER = "Only a test owner's data can be deleted here."

export function requireTestFunctions(allowTestFunctionsEnv: string | undefined): void {
  if (!areTestFunctionsAllowed(allowTestFunctionsEnv)) {
    throw new ConvexError(TEST_FUNCTIONS_OFF)
  }
}

function requireTestDeployment(): void {
  requireTestFunctions(process.env.ALLOW_TEST_FUNCTIONS)
}

async function requireTestOwner(ctx: MutationCtx, ownerId: Id<"users">): Promise<void> {
  const owner = await ctx.db.get(ownerId)
  const isTestOwner = owner?.email !== undefined && isTestOwnerEmail(owner.email)

  if (!isTestOwner) {
    throw new ConvexError(NOT_A_TEST_OWNER)
  }
}

// The user with her data (lib/ownerData.ts), sessions, refresh tokens and accounts.
async function deleteUserWithAuth(ctx: MutationCtx, userId: Id<"users">): Promise<void> {
  await deleteOwnerData(ctx, userId)

  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect()
  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect()

  for (const session of sessions) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect()

    for (const refreshToken of refreshTokens) {
      await ctx.db.delete(refreshToken._id)
    }

    await ctx.db.delete(session._id)
  }

  for (const account of accounts) {
    await ctx.db.delete(account._id)
  }

  await ctx.db.delete(userId)
}

export const createTestProject = internalMutation({
  args: {
    ownerSuffix: v.string(),
    name: v.string(),
  },
  returns: v.object({
    ownerId: v.id("users"),
    projectId: v.id("projects"),
    shareToken: v.string(),
  }),
  handler: async (ctx, args) => {
    requireTestDeployment()

    const ownerId = await ctx.db.insert("users", {
      email: testOwnerEmail(args.ownerSuffix),
      name: "Test owner",
    })
    const shareToken = newShareToken()
    const projectId = await ctx.db.insert("projects", {
      ownerId,
      name: args.name,
      shareToken,
    })

    return {
      ownerId,
      projectId,
      shareToken,
    }
  },
})

export const deleteTestOwner = internalMutation({
  args: {
    ownerSuffix: v.string(),
  },
  returns: v.object({
    deletedUsers: v.number(),
  }),
  handler: async (ctx, args) => {
    requireTestDeployment()

    const users = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", testOwnerEmail(args.ownerSuffix)))
      .collect()

    for (const user of users) {
      await requireTestOwner(ctx, user._id)
      await deleteUserWithAuth(ctx, user._id)
    }

    return {
      deletedUsers: users.length,
    }
  },
})
