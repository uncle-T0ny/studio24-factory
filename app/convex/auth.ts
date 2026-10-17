import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server"
import { ConvexError } from "convex/values"
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset"
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

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [OwnerPassword],
})
