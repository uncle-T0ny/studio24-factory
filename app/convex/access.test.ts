import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "./_generated/api"
import { AccountStatus } from "./lib/signIn"
import { newBackend, OWNER_EMAILS, signedIn, type TestCaller } from "./test.setup"

// The access rules end to end, through the public functions (lib/functions.ts, lib/access.ts):
// the owner, another owner, a signed-in user off the allowlist, nobody, the project's share
// token, a wrong token and a revoked one.

async function fixture() {
  const t = newBackend()
  const owner = await signedIn(t, "owner@example.com")
  const other = await signedIn(t, "other@example.com")
  const stranger = await signedIn(t, "stranger@example.com")
  const projectId = await owner.as.mutation(api.projects.create, { name: "Spring launch" })
  const project = await t.run(async (ctx) => await ctx.db.get(projectId))

  if (!project) {
    throw new Error("The fixture has no project.")
  }

  return {
    t,
    owner,
    other,
    stranger,
    projectId,
    shareToken: project.shareToken,
  }
}

beforeEach(() => {
  vi.stubEnv("OWNER_EMAILS", OWNER_EMAILS)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("project access", () => {
  it("shows the project to its owner and null to everyone else", async () => {
    const { t, owner, other, stranger, projectId } = await fixture()

    expect((await owner.as.query(api.projects.get, { projectId }))?.name).toBe("Spring launch")

    for (const caller of [other.as, stranger.as, t]) {
      expect(await caller.query(api.projects.get, { projectId })).toBeNull()
    }

    expect(await owner.as.query(api.projects.get, { projectId: "not-an-id" })).toBeNull()
  })

  it("lets the owner and the share token rename, and refuses everyone else", async () => {
    const { t, owner, other, stranger, projectId, shareToken } = await fixture()

    await owner.as.mutation(api.projects.rename, { projectId, name: " Renamed by owner " })
    await t.mutation(api.projects.rename, { projectId, name: "Renamed by guest", shareToken })

    const refusals: [TestCaller, string | undefined][] = [
      [other.as, undefined],
      [stranger.as, undefined],
      [t, undefined],
      [t, "wrong-token"],
      [t, ""],
      [owner.as, "wrong-token"],
    ]

    for (const [caller, token] of refusals) {
      await expect(
        caller.mutation(api.projects.rename, { projectId, name: "Hijacked", shareToken: token }),
      ).rejects.toThrow("Not allowed")
    }

    const project = await t.run(async (ctx) => await ctx.db.get(projectId))

    expect(project?.name).toBe("Renamed by guest")
  })

  it("opens a project by its share token only, without its owner's id", async () => {
    const { t, projectId, shareToken } = await fixture()
    const shared = await t.query(api.projects.getByShareToken, { shareToken })

    expect(shared?._id).toBe(projectId)
    expect(shared).not.toHaveProperty("ownerId")
    expect(await t.query(api.projects.getByShareToken, { shareToken: "wrong" })).toBeNull()
    expect(await t.query(api.projects.getByShareToken, { shareToken: "" })).toBeNull()
  })

  it("keeps owner-only functions from the share token", async () => {
    const { t, owner, projectId, shareToken } = await fixture()

    await expect(t.mutation(api.share.regenerate, { projectId, shareToken })).rejects.toThrow(
      "Not allowed",
    )
    await expect(t.mutation(api.projects.remove, { projectId })).rejects.toThrow("Not allowed")
    expect(await owner.as.query(api.projects.get, { projectId })).not.toBeNull()
  })
})

describe("owner access", () => {
  it("gives each owner her own projects and refuses everyone else", async () => {
    const { t, owner, other, stranger, projectId } = await fixture()

    expect((await owner.as.query(api.projects.listMine, {})).map((p) => p._id)).toEqual([projectId])
    expect(await other.as.query(api.projects.listMine, {})).toEqual([])
    await expect(stranger.as.query(api.projects.listMine, {})).rejects.toThrow("Not allowed")
    await expect(t.query(api.projects.listMine, {})).rejects.toThrow("Not allowed")
    await expect(other.as.mutation(api.projects.remove, { projectId })).rejects.toThrow(
      "Not allowed",
    )
  })

  it("locks an owner out once her email is taken off OWNER_EMAILS, and keeps the share link", async () => {
    const { t, owner, projectId, shareToken } = await fixture()

    vi.stubEnv("OWNER_EMAILS", "other@example.com")

    await expect(owner.as.query(api.projects.listMine, {})).rejects.toThrow("Not allowed")
    expect(await owner.as.query(api.projects.get, { projectId })).toBeNull()
    expect((await t.query(api.projects.getByShareToken, { shareToken }))?._id).toBe(projectId)
  })
})

describe("share.regenerate", () => {
  it("gives the owner a new token and revokes the old one", async () => {
    const { t, owner, projectId, shareToken } = await fixture()
    const newToken = await owner.as.mutation(api.share.regenerate, { projectId })

    expect(newToken).not.toBe(shareToken)
    expect(newToken.length).toBeGreaterThanOrEqual(32)
    expect(await t.query(api.projects.getByShareToken, { shareToken })).toBeNull()
    expect((await t.query(api.projects.getByShareToken, { shareToken: newToken }))?._id).toBe(
      projectId,
    )
    await expect(
      t.mutation(api.projects.rename, { projectId, name: "Old link", shareToken }),
    ).rejects.toThrow("Not allowed")
  })

  it("refuses nobody, another owner and the share token, and keeps the token", async () => {
    const { t, other, projectId, shareToken } = await fixture()

    for (const refusal of [
      t.mutation(api.share.regenerate, { projectId }),
      other.as.mutation(api.share.regenerate, { projectId }),
      t.mutation(api.share.regenerate, { projectId, shareToken }),
    ]) {
      await expect(refusal).rejects.toThrow("Not allowed")
    }

    const project = await t.run(async (ctx) => await ctx.db.get(projectId))

    expect(project?.shareToken).toBe(shareToken)
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
