import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { NewPasswordStep, RequestCodeStep } from "./PasswordReset"
import { CODE_FORMAT_ERROR, WRONG_CODE_ERROR } from "./resetRules"

const EMAIL = "owner@example.com"

function ignore() {}

function requestCodeMarkup(error: string | null, isSubmitting = false): string {
  return renderToStaticMarkup(
    createElement(RequestCodeStep, {
      email: EMAIL,
      error,
      isSubmitting,
      onEmailChange: ignore,
      onSubmit: ignore,
      onBack: ignore,
    }),
  )
}

function newPasswordMarkup(error: string | null, notice: string | null): string {
  return renderToStaticMarkup(
    createElement(NewPasswordStep, {
      email: EMAIL,
      error,
      notice,
      isSubmitting: false,
      onSubmit: ignore,
      onSendNewCode: ignore,
      onBack: ignore,
    }),
  )
}

describe("RequestCodeStep", () => {
  it("asks for the email and offers to send a code", () => {
    const markup = requestCodeMarkup(null)

    expect(markup).toContain('class="ui-card ui-card--narrow"')
    expect(markup).toContain("Reset password")
    expect(markup).toContain(`value="${EMAIL}"`)
    expect(markup).toContain("Send code")
    expect(markup).toContain("Back to sign in")
    expect(markup).not.toContain("ui-text--danger")
  })

  it("shows the error and disables the button while sending", () => {
    const markup = requestCodeMarkup(CODE_FORMAT_ERROR, true)

    expect(markup).toContain(
      `<p class="ui-text ui-text--danger ui-text--md">${CODE_FORMAT_ERROR}</p>`,
    )
    expect(markup).toMatch(
      /<button(?=[^>]*type="submit")(?=[^>]*disabled="")[^>]*>Send code<\/button>/,
    )
  })
})

describe("NewPasswordStep", () => {
  it("asks for the code and the new password for the email the code went to", () => {
    const markup = newPasswordMarkup(null, null)

    expect(markup).toContain(`We sent an 8-digit code to ${EMAIL}`)
    expect(markup).toContain('name="code"')
    expect(markup).toContain('autoComplete="one-time-code"')
    expect(markup).toContain('name="newPassword"')
    expect(markup).toContain('autoComplete="new-password"')
    expect(markup).toContain("Set new password")
    expect(markup).toContain("Send a new code")
    expect(markup).not.toContain("ui-text--danger")
  })

  it("shows a wrong-code error and a new-code notice", () => {
    const markup = newPasswordMarkup(WRONG_CODE_ERROR, `We sent a new code to ${EMAIL}.`)

    expect(markup).toContain(
      `<p class="ui-text ui-text--danger ui-text--md">${WRONG_CODE_ERROR}</p>`,
    )
    expect(markup).toContain(`We sent a new code to ${EMAIL}.`)
  })
})
