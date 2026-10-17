import { v } from "convex/values"
import { internalMutation } from "./_generated/server"
import { spendUsage } from "./lib/usage"
import { usageKindValidator } from "./lib/validators"

export const spend = internalMutation({
  args: {
    kind: usageKindValidator,
    amount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await spendUsage(ctx, args.kind, args.amount)

    return null
  },
})
