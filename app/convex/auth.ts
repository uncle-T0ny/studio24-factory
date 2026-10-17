import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials"
import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server"
import { ConvexError } from "convex/values"
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset"
import { internal } from "./_generated/api"
import type { DataModel, Id } from "./_generated/dataModel"
import { isOwnerEmail, normalizeEmail, ownerEnv } from "./lib/owners"

const SIGN_UP_FLOW = "signUp"

const OwnerPassword = Password({
  profile(params) {
    const email = normalizeEmail(typeof params.email === "string" ? params.email : "")
    const isSignUp = params.flow === SIGN_UP_FLOW

    if (isSignUp && !isOwnerEmail(email, ownerEnv())) {
      throw new ConvexError("This email can't sign up.")
    }

    return {
      email,
    }
  },
  reset: ResendOTPPasswordReset,
})

const DemoDeveloper = ConvexCredentials<DataModel>({
  id: "demo",
  authorize: async (_credentials, ctx): Promise<{ userId: Id<"users"> } | null> => {
    const demo: { ownerId: Id<"users"> } | null = await ctx.runQuery(internal.seed.owner, {})

    return demo ? { userId: demo.ownerId } : null
  },
})

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [OwnerPassword, DemoDeveloper],
})
