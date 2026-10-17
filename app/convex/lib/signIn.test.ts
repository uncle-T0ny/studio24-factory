import { describe, expect, it } from "vitest"
import type { OwnerEnv } from "./owners"
import { AccountStatus, accountStatusOf, isSignInLocked, type FoundAccount } from "./signIn"

const NOW = 1_800_000_000_000
const MINUTE_MS = 60 * 1000

describe("isSignInLocked", () => {
  it("is open without failed attempts", () => {
    expect(isSignInLocked(null, NOW)).toBe(false)
  })

  it("is open while attempts are left", () => {
    expect(isSignInLocked({ attemptsLeft: 3, lastAttemptTime: NOW }, NOW)).toBe(false)
  })

  it("locks after the last attempt is used", () => {
    expect(isSignInLocked({ attemptsLeft: 0, lastAttemptTime: NOW }, NOW)).toBe(true)
  })

  it("gives one attempt back every six minutes", () => {
    const limit = {
      attemptsLeft: 0,
      lastAttemptTime: NOW,
    }

    expect(isSignInLocked(limit, NOW + 5 * MINUTE_MS)).toBe(true)
    expect(isSignInLocked(limit, NOW + 6 * MINUTE_MS)).toBe(false)
  })
})

const OWNER = "owner@example.com"
const ENV: OwnerEnv = {
  ownerEmails: OWNER,
  allowTestFunctions: undefined,
}

function accountsWith(found: FoundAccount | null) {
  const lookedUp: string[] = []
  const findAccount = async (email: string) => {
    lookedUp.push(email)

    return found
  }

  return {
    lookedUp,
    findAccount,
  }
}

describe("accountStatusOf", () => {
  it("answers missing for an email outside OWNER_EMAILS, as for no account, without a lookup", async () => {
    const accounts = accountsWith({ limit: null })

    await expect(
      accountStatusOf("stranger@example.com", ENV, accounts.findAccount, NOW),
    ).resolves.toBe(AccountStatus.Missing)
    expect(accounts.lookedUp).toEqual([])
  })

  it("tells an allowlisted email's account apart: missing, ready or locked", async () => {
    const missing = accountsWith(null)
    const ready = accountsWith({ limit: null })
    const locked = accountsWith({ limit: { attemptsLeft: 0, lastAttemptTime: NOW } })

    await expect(
      accountStatusOf(" Owner@Example.com ", ENV, missing.findAccount, NOW),
    ).resolves.toBe(AccountStatus.Missing)
    expect(missing.lookedUp).toEqual([OWNER])
    await expect(accountStatusOf(OWNER, ENV, ready.findAccount, NOW)).resolves.toBe(
      AccountStatus.Ready,
    )
    await expect(accountStatusOf(OWNER, ENV, locked.findAccount, NOW)).resolves.toBe(
      AccountStatus.Locked,
    )
  })
})
