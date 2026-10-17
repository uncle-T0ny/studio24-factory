import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { internal } from "./_generated/api"
import type { DataModel, Id } from "./_generated/dataModel"
import { internalAction, internalMutation, internalQuery } from "./_generated/server"
import { isOwnerEmail, normalizeEmail, ownerEnv } from "./lib/owners"

// The local demo data `npm start` seeds on every run (app/scripts/start.ts): a demo owner who
// can sign in, then the app's own demo records. It is idempotent: a re-run creates nothing new
// and only keeps the demo owner's password equal to DEMO_OWNER_PASSWORD. The start script sets
// DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD and OWNER_EMAILS (with the demo email in it) on the
// local deployment first, through stdin, so the password is never on a command line.

// The Password provider's id (convex/auth.ts), which keys its accounts.
const PASSWORD_PROVIDER = "password"

const SEED_NOT_SET_UP =
  "Set DEMO_OWNER_EMAIL and DEMO_OWNER_PASSWORD on the deployment first (npm start does)."
const SEED_NOT_AN_OWNER = "DEMO_OWNER_EMAIL must be in OWNER_EMAILS, or the demo owner can't work."

interface DemoOwner {
  email: string
  password: string
}

interface SeededOwner {
  email: string
  ownerId: Id<"users">
}

const seededOwnerValidator = v.object({ email: v.string(), ownerId: v.id("users") })

function demoOwner(): DemoOwner {
  const email = normalizeEmail(process.env.DEMO_OWNER_EMAIL ?? "")
  const password = process.env.DEMO_OWNER_PASSWORD?.trim() ?? ""

  if (email.length === 0 || password.length === 0) {
    throw new ConvexError(SEED_NOT_SET_UP)
  }

  if (!isOwnerEmail(email, ownerEnv())) {
    throw new ConvexError(SEED_NOT_AN_OWNER)
  }

  return { email, password }
}

// The user behind a password account, or null. `npm run start:check` runs it to prove the seed.
export const owner = internalQuery({
  args: {
    email: v.optional(v.string()),
  },
  returns: v.union(seededOwnerValidator, v.null()),
  handler: async (ctx, args): Promise<SeededOwner | null> => {
    const email = normalizeEmail(args.email ?? process.env.DEMO_OWNER_EMAIL ?? "")
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", PASSWORD_PROVIDER).eq("providerAccountId", email),
      )
      .unique()

    return account ? { email, ownerId: account.userId } : null
  },
})

// =====================================================================================
// THE APP'S SEED HOOK. Put the app's own demo records for the demo owner here (for example a
// demo client with a few records), with ctx.db and the owner's id. It runs on every `npm start`,
// so keep it idempotent: look a record up before you insert it. The starter seeds nothing here.
// =====================================================================================
export const demoData = internalMutation({
  args: {
    ownerId: v.id("users"),
  },
  returns: v.null(),
  handler: () => null,
})

// The seed: creates the demo owner's account once (with the Password provider's own hashing),
// keeps its password in step on later runs, then runs the app's hook. An action, because
// Convex Auth creates password accounts only from an action.
export const run = internalAction({
  args: {},
  returns: v.object({ email: v.string(), ownerId: v.id("users"), created: v.boolean() }),
  handler: async (ctx): Promise<SeededOwner & { created: boolean }> => {
    const { email, password } = demoOwner()
    const account = { id: email, secret: password }
    const existing: SeededOwner | null = await ctx.runQuery(internal.seed.owner, { email })
    let ownerId: Id<"users">

    if (existing) {
      await modifyAccountCredentials<DataModel>(ctx, { provider: PASSWORD_PROVIDER, account })
      ownerId = existing.ownerId
    } else {
      const created = await createAccount<DataModel>(ctx, {
        provider: PASSWORD_PROVIDER,
        account,
        profile: { email },
      })

      ownerId = created.user._id
    }

    await ctx.runMutation(internal.seed.demoData, { ownerId })

    return { email, ownerId, created: existing === null }
  },
})
