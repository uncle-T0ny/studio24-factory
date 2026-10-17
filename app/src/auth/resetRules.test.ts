import { describe, expect, it } from "vitest"
import {
  CODE_FORMAT_ERROR,
  EMAIL_NOT_SENT_ERROR,
  RESET_CODE_LENGTH,
  SEND_CODE_ERROR,
  TOO_MANY_ATTEMPTS_ERROR,
  WEAK_PASSWORD_ERROR,
  WRONG_CODE_ERROR,
  newPasswordProblem,
  normalizeResetCode,
  resetCodeProblem,
  resetErrorMessage,
  sendCodeErrorMessage,
} from "./resetRules"
import { RESET_CODE_LENGTH as SERVER_RESET_CODE_LENGTH } from "../../convex/ResendOTPPasswordReset"

function convexError(message: string): Error {
  return new Error(
    `[CONVEX A(auth:signIn)] [Request ID: 1] Server Error\nUncaught Error: ${message}\n    at authorize`,
  )
}

describe("reset code", () => {
  it("has the length the server sends", () => {
    expect(RESET_CODE_LENGTH).toBe(SERVER_RESET_CODE_LENGTH)
  })

  it("drops spaces from a pasted code", () => {
    expect(normalizeResetCode(" 1234 5678 ")).toBe("12345678")
  })

  it("accepts exactly 8 digits", () => {
    expect(resetCodeProblem("12345678")).toBeNull()
    expect(resetCodeProblem("1234567")).toBe(CODE_FORMAT_ERROR)
    expect(resetCodeProblem("123456789")).toBe(CODE_FORMAT_ERROR)
    expect(resetCodeProblem("1234abcd")).toBe(CODE_FORMAT_ERROR)
    expect(resetCodeProblem("")).toBe(CODE_FORMAT_ERROR)
  })
})

describe("newPasswordProblem", () => {
  it("asks for at least 8 characters, like the server", () => {
    expect(newPasswordProblem("short")).toBe(WEAK_PASSWORD_ERROR)
    expect(newPasswordProblem("1234567")).toBe(WEAK_PASSWORD_ERROR)
    expect(newPasswordProblem("12345678")).toBeNull()
  })
})

describe("sendCodeErrorMessage", () => {
  it("says the email failed when Resend refused it", () => {
    expect(sendCodeErrorMessage(convexError("Could not send"))).toBe(EMAIL_NOT_SENT_ERROR)
  })

  it("asks to check the email otherwise", () => {
    expect(sendCodeErrorMessage(convexError("InvalidAccountId"))).toBe(SEND_CODE_ERROR)
    expect(sendCodeErrorMessage(new Error("Server Error"))).toBe(SEND_CODE_ERROR)
    expect(sendCodeErrorMessage("not an error")).toBe(SEND_CODE_ERROR)
  })
})

describe("resetErrorMessage", () => {
  it("says the code is wrong for a wrong, expired or redacted code error", () => {
    expect(resetErrorMessage(convexError("Invalid code"))).toBe(WRONG_CODE_ERROR)
    expect(resetErrorMessage(convexError("Could not verify code"))).toBe(WRONG_CODE_ERROR)
    expect(resetErrorMessage(new Error("Server Error"))).toBe(WRONG_CODE_ERROR)
  })

  it("names the rate limit and the weak password", () => {
    const rateLimited = convexError("Too many failed attempts to verify code for this email")

    expect(resetErrorMessage(rateLimited)).toBe(TOO_MANY_ATTEMPTS_ERROR)
    expect(resetErrorMessage(convexError("Invalid password"))).toBe(WEAK_PASSWORD_ERROR)
  })
})
