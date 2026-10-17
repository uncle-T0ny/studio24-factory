import { describe, expect, it } from "vitest"
import {
  AuthProblem,
  AuthProblemAction,
  authProblemAction,
  signInProblemOf,
  signUpProblemOf,
} from "./authProblems"
import { AccountStatus } from "../../convex/lib/signIn"

describe("signInProblemOf", () => {
  it("names the reason a sign-in failed from the account's status", () => {
    expect(signInProblemOf(AccountStatus.Missing)).toBe(AuthProblem.NoAccount)
    expect(signInProblemOf(AccountStatus.Ready)).toBe(AuthProblem.WrongPassword)
    expect(signInProblemOf(AccountStatus.Locked)).toBe(AuthProblem.TooManyAttempts)
    expect(signInProblemOf(null)).toBe(AuthProblem.SignInFailed)
  })
})

describe("signUpProblemOf", () => {
  it("tells an existing account from an email that may not sign up", () => {
    expect(signUpProblemOf(AccountStatus.Ready)).toBe(AuthProblem.AccountExists)
    expect(signUpProblemOf(AccountStatus.Locked)).toBe(AuthProblem.AccountExists)
    expect(signUpProblemOf(AccountStatus.Missing)).toBe(AuthProblem.SignUpRefused)
    expect(signUpProblemOf(null)).toBe(AuthProblem.SignUpRefused)
  })
})

describe("authProblemAction", () => {
  it("offers the one step that fixes the problem", () => {
    expect(authProblemAction(AuthProblem.NoAccount)).toBe(AuthProblemAction.CreateAccount)
    expect(authProblemAction(AuthProblem.AccountExists)).toBe(AuthProblemAction.SignIn)
    expect(authProblemAction(AuthProblem.WrongPassword)).toBe(AuthProblemAction.ResetPassword)
    expect(authProblemAction(AuthProblem.TooManyAttempts)).toBe(AuthProblemAction.ResetPassword)
    expect(authProblemAction(AuthProblem.SignInFailed)).toBeNull()
    expect(authProblemAction(AuthProblem.SignUpRefused)).toBeNull()
  })
})
