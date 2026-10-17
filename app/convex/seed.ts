import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { internal } from "./_generated/api"
import type { DataModel, Id } from "./_generated/dataModel"
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"
import { insertClientLink } from "./lib/clientLinks"
import { isOwnerEmail, normalizeEmail, ownerEnv } from "./lib/owners"
import { deleteProjectData } from "./lib/projectData"
import { insertProject } from "./lib/projects"
import { hashToken, newShareToken } from "./lib/shareToken"
import { STAGES, stageValidator, type Stage } from "./lib/validators"

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

interface DemoLink {
  stage: Stage
  token: string
}

const seededOwnerValidator = v.object({ email: v.string(), ownerId: v.id("users") })
const demoLinkValidator = v.object({ stage: stageValidator, token: v.string() })

const DEMO_SLUG = "demo-client"
const CLIENT_STAGES = STAGES.filter((stage) => stage !== "transferred")

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

async function findDemoOwner(ctx: QueryCtx, rawEmail?: string): Promise<SeededOwner | null> {
  const email = normalizeEmail(rawEmail ?? process.env.DEMO_OWNER_EMAIL ?? "")
  const account = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", PASSWORD_PROVIDER).eq("providerAccountId", email),
    )
    .unique()

  return account ? { email, ownerId: account.userId } : null
}

async function findDemoProject(ctx: MutationCtx, ownerId: Id<"users">) {
  const project = await ctx.db
    .query("projects")
    .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
    .unique()

  return project?.ownerId === ownerId ? project : null
}

async function createDemoProject(ctx: MutationCtx, ownerId: Id<"users">) {
  const projectId = await insertProject(ctx, ownerId, {
    clientName: "Demo client",
    title: "Demo client's app",
    slug: DEMO_SLUG,
    isDemo: true,
  })

  for (const stage of STAGES) {
    const isFirst = stage === "interview"

    await ctx.db.insert("stageEvents", {
      projectId,
      stage,
      status: isFirst ? "active" : "pending",
      startedAt: isFirst ? Date.now() : undefined,
    })
  }

  for (const stage of CLIENT_STAGES) {
    await insertClientLink(ctx, projectId, [stage])
  }

  return projectId
}

// The token is stored hashed, so printing a working link means minting a new one each run.
async function renewStageLink(ctx: MutationCtx, projectId: Id<"projects">): Promise<DemoLink> {
  const project = await ctx.db.get(projectId)

  if (!project) {
    throw new ConvexError("The demo project is gone.")
  }

  const links = await ctx.db
    .query("clientLinks")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect()
  const link = links.find((candidate) => candidate.stages.includes(project.stage))

  if (!link) {
    return { stage: project.stage, ...(await insertClientLink(ctx, projectId, [project.stage])) }
  }

  const token = newShareToken()

  await ctx.db.patch(link._id, { tokenHash: await hashToken(token), revokedAt: undefined })

  return { stage: project.stage, token }
}

export const owner = internalQuery({
  args: {
    email: v.optional(v.string()),
  },
  returns: v.union(seededOwnerValidator, v.null()),
  handler: async (ctx, args) => await findDemoOwner(ctx, args.email),
})

export const demoData = internalMutation({
  args: {
    ownerId: v.id("users"),
  },
  returns: demoLinkValidator,
  handler: async (ctx, args) => {
    const project = await findDemoProject(ctx, args.ownerId)
    const projectId = project?._id ?? (await createDemoProject(ctx, args.ownerId))

    return await renewStageLink(ctx, projectId)
  },
})

export const reseed = internalMutation({
  args: {},
  returns: demoLinkValidator,
  handler: async (ctx) => {
    const demo = await findDemoOwner(ctx)

    if (!demo) {
      throw new ConvexError("No demo developer yet: run npm start first.")
    }

    const project = await findDemoProject(ctx, demo.ownerId)

    if (project) {
      await deleteProjectData(ctx, project._id)
      await ctx.db.delete(project._id)
    }

    return await renewStageLink(ctx, await createDemoProject(ctx, demo.ownerId))
  },
})

// An action: Convex Auth creates password accounts only from an action.
export const run = internalAction({
  args: {},
  returns: v.object({
    email: v.string(),
    ownerId: v.id("users"),
    created: v.boolean(),
    link: demoLinkValidator,
  }),
  handler: async (ctx): Promise<SeededOwner & { created: boolean; link: DemoLink }> => {
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

    const link: DemoLink = await ctx.runMutation(internal.seed.demoData, { ownerId })

    return { email, ownerId, created: existing === null, link }
  },
})
