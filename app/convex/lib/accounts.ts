import { PASSWORD_PROVIDER, type FoundAccount } from "./signIn"
import type { QueryCtx } from "../_generated/server"

// The password account of an email, with its sign-in rate limit, or null.
export async function findPasswordAccount(
  ctx: QueryCtx,
  email: string,
): Promise<FoundAccount | null> {
  const account = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", PASSWORD_PROVIDER).eq("providerAccountId", email),
    )
    .unique()

  if (account === null) {
    return null
  }

  const limit = await ctx.db
    .query("authRateLimits")
    .withIndex("identifier", (q) => q.eq("identifier", account._id))
    .unique()

  return {
    limit,
  }
}
