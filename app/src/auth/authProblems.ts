import { AccountStatus } from "../../convex/lib/signIn"

export enum AuthProblem {
  NoAccount = "noAccount",
  WrongPassword = "wrongPassword",
  TooManyAttempts = "tooManyAttempts",
  SignInFailed = "signInFailed",
  AccountExists = "accountExists",
  SignUpRefused = "signUpRefused",
}

export enum AuthProblemAction {
  CreateAccount = "createAccount",
  SignIn = "signIn",
  ResetPassword = "resetPassword",
}

export const AUTH_PROBLEM_MESSAGES: Record<AuthProblem, string> = {
  [AuthProblem.NoAccount]: "No account with this email.",
  [AuthProblem.WrongPassword]: "Wrong password.",
  [AuthProblem.TooManyAttempts]: "Too many wrong passwords. Wait a few minutes, or reset it.",
  [AuthProblem.SignInFailed]: "Couldn't sign in. Check the email and password.",
  [AuthProblem.AccountExists]: "This email already has an account.",
  [AuthProblem.SignUpRefused]: "Couldn't sign up. Only the owners' emails can make an account.",
}

export const AUTH_PROBLEM_ACTION_LABELS: Record<AuthProblemAction, string> = {
  [AuthProblemAction.CreateAccount]: "Create one?",
  [AuthProblemAction.SignIn]: "Sign in instead?",
  [AuthProblemAction.ResetPassword]: "Forgot password?",
}

// accounts:status never says an email is off the allowlist (see AccountStatus): such an email
// reads as one with no account, is offered sign-up, and sign-up refuses it (SignUpRefused).
export function signInProblemOf(status: AccountStatus | null): AuthProblem {
  switch (status) {
    case AccountStatus.Missing:
      return AuthProblem.NoAccount
    case AccountStatus.Locked:
      return AuthProblem.TooManyAttempts
    case AccountStatus.Ready:
      return AuthProblem.WrongPassword
    case null:
      return AuthProblem.SignInFailed
  }
}

export function signUpProblemOf(status: AccountStatus | null): AuthProblem {
  const hasAccount = status === AccountStatus.Ready || status === AccountStatus.Locked

  return hasAccount ? AuthProblem.AccountExists : AuthProblem.SignUpRefused
}

export function authProblemAction(problem: AuthProblem): AuthProblemAction | null {
  switch (problem) {
    case AuthProblem.NoAccount:
      return AuthProblemAction.CreateAccount
    case AuthProblem.AccountExists:
      return AuthProblemAction.SignIn
    case AuthProblem.WrongPassword:
    case AuthProblem.TooManyAttempts:
      return AuthProblemAction.ResetPassword
    case AuthProblem.SignInFailed:
    case AuthProblem.SignUpRefused:
      return null
  }
}
