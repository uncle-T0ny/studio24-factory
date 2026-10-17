import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import {
  LINK_NOT_VALID,
  notAtStage,
  requireClientStage,
  SIGN_IN_FIRST,
  WRONG_STAGE,
} from "./lib/access"
import { insertClientLink } from "./lib/clientLinks"
import { hashToken } from "./lib/shareToken"
import { AccountStatus } from "./lib/signIn"
import type { Stage } from "./lib/validators"
import { newBackend, OWNER_EMAILS, projectWithLink, signedIn, type TestBackend } from "./test.setup"

async function fixture() {
  const t = newBackend()
  const owner = await signedIn(t, "owner@example.com")
  const other = await signedIn(t, "other@example.com")
  const stranger = await signedIn(t, "stranger@example.com")
  const { projectId, linkId, token } = await projectWithLink(t, owner.userId, ["interview"])

  return { t, owner, other, stranger, projectId, linkId, token }
}

async function open(t: TestBackend, token: string, stage: Stage) {
  return await t.run(async (ctx) => (await requireClientStage(ctx, token, stage)).project._id)
}

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("owner access", () => {
  it("gives each owner her own projects and refuses everyone else", async () => {
    const { t, owner, other, stranger, projectId } = await fixture()

    expect((await owner.as.query(api.projects.listMine, {})).map((p) => p._id)).toEqual([projectId])
    expect(await owner.as.query(api.projects.get, { projectId })).not.toBeNull()
    expect(await other.as.query(api.projects.listMine, {})).toEqual([])
    expect(await other.as.query(api.projects.get, { projectId })).toBeNull()
    await expect(stranger.as.query(api.projects.listMine, {})).rejects.toThrow("Not allowed")
    await expect(t.query(api.projects.listMine, {})).rejects.toThrow("Not allowed")
    await expect(other.as.mutation(api.projects.remove, { projectId })).rejects.toThrow(
      "Not allowed",
    )
  })

  it("locks an owner out once her email is taken off OWNER_EMAILS, and keeps the client link", async () => {
    const { t, owner, projectId, token } = await fixture()

    vi.stubEnv("OWNER_EMAILS", "other@example.com")

    await expect(owner.as.query(api.projects.listMine, {})).rejects.toThrow("Not allowed")
    expect(await open(t, token, "interview")).toBe(projectId)
  })
})

describe("client link access", () => {
  it("opens the stage its link allows, for anyone holding the token", async () => {
    const { t, projectId, token } = await fixture()

    expect(await open(t, token, "interview")).toBe(projectId)
  })

  it("rejects a client link opened at the wrong stage", async () => {
    const { t, token } = await fixture()

    await expect(open(t, token, "prd")).rejects.toThrow(WRONG_STAGE)
  })

  it("refuses a stage the project hasn't reached yet, naming the current stage", async () => {
    const { t, projectId } = await fixture()
    const { token } = await t.run(async (ctx) => await insertClientLink(ctx, projectId, ["prd"]))

    await expect(open(t, token, "prd")).rejects.toThrow(notAtStage("interview"))
  })

  it("still opens a stage the project has moved past", async () => {
    const { t, projectId, token } = await fixture()

    await t.run(async (ctx) => await ctx.db.patch(projectId, { stage: "prd" }))

    expect(await open(t, token, "interview")).toBe(projectId)
  })

  it("rejects an unknown, an empty, a revoked and an expired link", async () => {
    const { t, linkId, token } = await fixture()

    await expect(open(t, "wrong-token", "interview")).rejects.toThrow(LINK_NOT_VALID)
    await expect(open(t, "", "interview")).rejects.toThrow(LINK_NOT_VALID)

    await t.run(async (ctx) => await ctx.db.patch(linkId, { expiresAt: Date.now() - 1 }))
    await expect(open(t, token, "interview")).rejects.toThrow(LINK_NOT_VALID)

    await t.run(async (ctx) => await ctx.db.patch(linkId, { expiresAt: undefined, revokedAt: 1 }))
    await expect(open(t, token, "interview")).rejects.toThrow(LINK_NOT_VALID)
  })

  it("asks for a sign-in on a link to the final app", async () => {
    const { t, owner, projectId } = await fixture()
    const { token } = await t.run(async (ctx) => {
      await ctx.db.patch(projectId, { stage: "final" })

      return await insertClientLink(ctx, projectId, ["final"])
    })

    await expect(open(t, token, "final")).rejects.toThrow(SIGN_IN_FIRST)
    expect(
      await owner.as.run(
        async (ctx) => (await requireClientStage(ctx, token, "final")).project._id,
      ),
    ).toBe(projectId)
  })

  it("stores the token's hash, never the token", async () => {
    const { t, linkId, token } = await fixture()
    const link = await t.run(async (ctx) => await ctx.db.get(linkId))

    expect(link?.tokenHash).toBe(await hashToken(token))
    expect(JSON.stringify(link)).not.toContain(token)
  })
})

describe("accounts.status", () => {
  it("tells a usable account from none, and never whether an email is on the allowlist", async () => {
    const { t, owner, stranger } = await fixture()

    await t.run(async (ctx) => {
      const accounts = [
        { userId: owner.userId, email: "owner@example.com" },
        { userId: stranger.userId, email: "stranger@example.com" },
      ]

      for (const { userId, email } of accounts) {
        await ctx.db.insert("authAccounts", {
          userId,
          provider: "password",
          providerAccountId: email,
        })
      }
    })

    const statusOf = async (email: string) => await t.query(api.accounts.status, { email })

    expect(await statusOf(" Owner@Example.com ")).toBe(AccountStatus.Ready)
    expect(await statusOf("other@example.com")).toBe(AccountStatus.Missing)
    expect(await statusOf("stranger@example.com")).toBe(AccountStatus.Missing)
    expect(await statusOf("nobody@example.com")).toBe(AccountStatus.Missing)
  })
})
