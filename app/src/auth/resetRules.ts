export const RESET_CODE_LENGTH = 8
export const MIN_PASSWORD_LENGTH = 8

export const SEND_CODE_ERROR =
  "Couldn't send a code. Check that this is the email you sign in with."
export const EMAIL_NOT_SENT_ERROR = "Couldn't send the email right now. Try again in a minute."
export const CODE_FORMAT_ERROR = `Enter the ${RESET_CODE_LENGTH}-digit code from the email.`
export const WRONG_CODE_ERROR =
  "That code is wrong or has expired. Check the email, or send a new code."
export const TOO_MANY_ATTEMPTS_ERROR =
  "Too many wrong codes for this email. Wait a while, then send a new code."
export const WEAK_PASSWORD_ERROR = `The new password is too short: use at least ${MIN_PASSWORD_LENGTH} characters.`

const RESEND_FAILED_MESSAGE = "Could not send"
const RATE_LIMITED_MESSAGE = "Too many failed attempts"
const INVALID_PASSWORD_MESSAGE = "Invalid password"

export function normalizeResetCode(code: string): string {
  return code.replace(/\s+/g, "")
}

export function resetCodeProblem(code: string): string | null {
  const isDigitsOnly = /^\d+$/.test(code)

  if (!isDigitsOnly || code.length !== RESET_CODE_LENGTH) {
    return CODE_FORMAT_ERROR
  }

  return null
}

export function newPasswordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return WEAK_PASSWORD_ERROR
  }

  return null
}

function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return ""
}

export function sendCodeErrorMessage(error: unknown): string {
  const message = messageOf(error)

  if (message.includes(RESEND_FAILED_MESSAGE)) {
    return EMAIL_NOT_SENT_ERROR
  }

  return SEND_CODE_ERROR
}

export function resetErrorMessage(error: unknown): string {
  const message = messageOf(error)

  if (message.includes(RATE_LIMITED_MESSAGE)) {
    return TOO_MANY_ATTEMPTS_ERROR
  }

  if (message.includes(INVALID_PASSWORD_MESSAGE)) {
    return WEAK_PASSWORD_ERROR
  }

  return WRONG_CODE_ERROR
}
