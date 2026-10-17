import { v } from "convex/values"
import { isOwnerEmail, normalizeEmail, type OwnerEnv } from "./owners"

export enum AccountStatus {
  Missing = "missing",
  Locked = "locked",
  Ready = "ready",
}

export const accountStatusValidator = v.union(
  v.literal(AccountStatus.Missing),
  v.literal(AccountStatus.Locked),
  v.literal(AccountStatus.Ready),
)

export interface SignInLimit {
  attemptsLeft: number
  lastAttemptTime: number
}

export const PASSWORD_PROVIDER = "password"
export const MAX_FAILED_SIGN_INS_PER_HOUR = 10

const HOUR_MS = 60 * 60 * 1000

export function isSignInLocked(
  limit: SignInLimit | null,
  now: number,
  maxPerHour = MAX_FAILED_SIGN_INS_PER_HOUR,
): boolean {
  if (limit === null) {
    return false
  }

  const elapsedMs = Math.max(0, now - limit.lastAttemptTime)
  const regained = (elapsedMs * maxPerHour) / HOUR_MS
  const attemptsLeft = Math.min(maxPerHour, limit.attemptsLeft + regained)

  return attemptsLeft < 1
}

export interface FoundAccount {
  limit: SignInLimit | null
}

export type FindAccount = (email: string) => Promise<FoundAccount | null>

export async function accountStatusOf(
  rawEmail: string,
  env: OwnerEnv,
  findAccount: FindAccount,
  now: number,
): Promise<AccountStatus> {
  const email = normalizeEmail(rawEmail)

  if (!isOwnerEmail(email, env)) {
    return AccountStatus.Missing
  }

  const account = await findAccount(email)

  if (account === null) {
    return AccountStatus.Missing
  }

  return isSignInLocked(account.limit, now) ? AccountStatus.Locked : AccountStatus.Ready
}
