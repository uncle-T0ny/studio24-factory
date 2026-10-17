import { v } from "convex/values"
import { findPasswordAccount } from "./lib/accounts"
import { publicQuery } from "./lib/functions"
import { ownerEnv } from "./lib/owners"
import { accountStatusOf, accountStatusValidator } from "./lib/signIn"

export const status = publicQuery({
  args: {
    email: v.string(),
  },
  returns: accountStatusValidator,
  handler: async (ctx, args) =>
    await accountStatusOf(
      args.email,
      ownerEnv(),
      (email) => findPasswordAccount(ctx, email),
      Date.now(),
    ),
})
