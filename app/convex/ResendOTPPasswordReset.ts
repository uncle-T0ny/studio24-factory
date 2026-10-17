import Resend from "@auth/core/providers/resend"
import { generateRandomString, type RandomReader } from "@oslojs/crypto/random"
import { Resend as ResendAPI } from "resend"
import { APP_NAME, DEFAULT_EMAIL_FROM } from "./lib/appConfig"

export const RESET_EMAIL_SUBJECT = `Reset your ${APP_NAME} password`
export const RESET_CODE_LENGTH = 8

const RESET_CODE_ALPHABET = "0123456789"

const cryptoRandom: RandomReader = {
  read(bytes) {
    crypto.getRandomValues(bytes)
  },
}

// The sender: AUTH_EMAIL_FROM on the deployment, on a domain verified in Resend.
export function resetEmailFrom(emailFromEnv: string | undefined): string {
  const from = emailFromEnv?.trim() ?? ""

  return from.length > 0 ? from : DEFAULT_EMAIL_FROM
}

export function generateResetCode(random: RandomReader = cryptoRandom): string {
  return generateRandomString(random, RESET_CODE_ALPHABET, RESET_CODE_LENGTH)
}

export function resetEmailText(code: string): string {
  return [
    `Your ${APP_NAME} password reset code: ${code}`,
    "",
    "Enter it on the sign-in page to choose a new password.",
    "If you didn't ask to reset your password, ignore this email.",
  ].join("\n")
}

export const ResendOTPPasswordReset = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  generateVerificationToken() {
    return generateResetCode()
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey)
    const { error } = await resend.emails.send({
      from: resetEmailFrom(process.env.AUTH_EMAIL_FROM),
      to: [email],
      subject: RESET_EMAIL_SUBJECT,
      text: resetEmailText(token),
    })

    if (error) {
      throw new Error("Could not send")
    }
  },
})
