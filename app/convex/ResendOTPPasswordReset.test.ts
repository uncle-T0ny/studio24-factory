import type { EmailConfig, EmailUserConfig } from "@auth/core/providers"
import type { RandomReader } from "@oslojs/crypto/random"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  RESET_CODE_LENGTH,
  RESET_EMAIL_SUBJECT,
  ResendOTPPasswordReset,
  generateResetCode,
  resetEmailFrom,
  resetEmailText,
} from "./ResendOTPPasswordReset"
import { APP_NAME, DEFAULT_EMAIL_FROM } from "./lib/appConfig"

interface SentEmail {
  from: string
  to: string[]
  subject: string
  text: string
}

type SendResult = { error: { message: string } | null }

const resendMock = vi.hoisted(() => ({
  apiKeys: new Array<string | undefined>(),
  send: vi.fn<(email: SentEmail) => Promise<SendResult>>(),
}))

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: resendMock.send,
    }

    constructor(apiKey?: string) {
      resendMock.apiKeys.push(apiKey)
    }
  },
}))

const OWNER_EMAIL = "owner@example.com"
const SENDER = "Example App <no-reply@app.example.com>"
const EIGHT_DIGITS = /^\d{8}$/

function userOptions(provider: EmailConfig): EmailUserConfig {
  const options = provider.options

  if (!options) {
    throw new Error("The provider has no user options")
  }

  return options
}

function sendParams(token: string) {
  return {
    identifier: OWNER_EMAIL,
    url: "http://localhost",
    expires: new Date(),
    provider: {
      ...ResendOTPPasswordReset,
      apiKey: "test-key",
    },
    token,
    theme: {},
    request: new Request("http://localhost"),
  }
}

describe("generateResetCode", () => {
  it("makes an 8-digit code from crypto randomness", () => {
    const codes = Array.from({ length: 200 }, () => generateResetCode())

    expect(RESET_CODE_LENGTH).toBe(8)

    for (const code of codes) {
      expect(code).toMatch(EIGHT_DIGITS)
    }

    expect(new Set(codes).size).toBeGreaterThan(190)
  })

  it("reads its digits from the given random source", () => {
    const zeros: RandomReader = {
      read(bytes) {
        bytes.fill(0)
      },
    }

    expect(generateResetCode(zeros)).toBe("00000000")
  })
})

describe("resetEmailFrom", () => {
  it("takes AUTH_EMAIL_FROM, else the placeholder sender", () => {
    expect(resetEmailFrom(` ${SENDER} `)).toBe(SENDER)
    expect(resetEmailFrom(undefined)).toBe(DEFAULT_EMAIL_FROM)
    expect(resetEmailFrom("  ")).toBe(DEFAULT_EMAIL_FROM)
  })
})

describe("ResendOTPPasswordReset", () => {
  beforeEach(() => {
    resendMock.apiKeys.length = 0
    resendMock.send.mockReset()
    vi.stubEnv("AUTH_EMAIL_FROM", SENDER)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("is the Resend provider the docs name", () => {
    expect(ResendOTPPasswordReset.id).toBe("resend")
    expect(ResendOTPPasswordReset.type).toBe("email")
    expect(userOptions(ResendOTPPasswordReset).id).toBe("resend-otp")
  })

  it("generates its verification token as an 8-digit code", async () => {
    const token = await userOptions(ResendOTPPasswordReset).generateVerificationToken?.()

    expect(token).toMatch(EIGHT_DIGITS)
  })

  it("sends the code in a plain-text email from AUTH_EMAIL_FROM", async () => {
    resendMock.send.mockResolvedValue({ error: null })

    await userOptions(ResendOTPPasswordReset).sendVerificationRequest?.(sendParams("12345678"))

    expect(resendMock.apiKeys).toEqual(["test-key"])
    expect(resendMock.send).toHaveBeenCalledWith({
      from: SENDER,
      to: [OWNER_EMAIL],
      subject: `Reset your ${APP_NAME} password`,
      text: resetEmailText("12345678"),
    })
    expect(RESET_EMAIL_SUBJECT).toBe(`Reset your ${APP_NAME} password`)
  })

  it("fails when Resend refuses the email", async () => {
    resendMock.send.mockResolvedValue({ error: { message: "domain not verified" } })

    const sending = userOptions(ResendOTPPasswordReset).sendVerificationRequest?.(
      sendParams("12345678"),
    )

    await expect(sending).rejects.toThrow("Could not send")
  })
})

describe("resetEmailText", () => {
  it("is short plain text with the code", () => {
    const text = resetEmailText("87654321")

    expect(text).toContain(`Your ${APP_NAME} password reset code: 87654321`)
    expect(text).not.toMatch(/<[a-z]/i)
    expect(text.split("\n").length).toBeLessThanOrEqual(5)
  })
})
