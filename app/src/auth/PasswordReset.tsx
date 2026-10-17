import { useAuthActions } from "@convex-dev/auth/react"
import { useState, type SubmitEvent } from "react"
import { normalizeEmail } from "../../convex/lib/owners"
import { BRAND } from "../app.config"
import {
  Button,
  ButtonVariant,
  Card,
  Eyebrow,
  Field,
  Heading,
  HeadingLevel,
  Text,
  TextField,
  TextSize,
  TextTone,
} from "../ui"
import {
  RESET_CODE_LENGTH,
  newPasswordProblem,
  normalizeResetCode,
  resetCodeProblem,
  resetErrorMessage,
  sendCodeErrorMessage,
} from "./resetRules"

const RESET_FLOW = "reset"
const RESET_VERIFICATION_FLOW = "reset-verification"

interface PasswordResetProps {
  initialEmail: string
  onBack: () => void
}

// A text field's value; a file input or a missing field reads as empty.
function formText(formData: FormData, name: string): string {
  const value = formData.get(name)

  return typeof value === "string" ? value : ""
}

export function PasswordReset({ initialEmail, onBack }: PasswordResetProps) {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState(initialEmail)
  const [sentToEmail, setSentToEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sendCode = async (toEmail: string): Promise<boolean> => {
    setError(null)
    setNotice(null)
    setIsSubmitting(true)

    try {
      await signIn("password", {
        email: toEmail,
        flow: RESET_FLOW,
      })

      return true
    } catch (caught) {
      setError(sendCodeErrorMessage(caught))

      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestCode = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = normalizeEmail(email)
    const isSent = await sendCode(normalizedEmail)

    if (isSent) {
      setSentToEmail(normalizedEmail)
    }
  }

  const sendNewCode = async (toEmail: string) => {
    const isSent = await sendCode(toEmail)

    if (isSent) {
      setNotice(`We sent a new code to ${toEmail}.`)
    }
  }

  const resetPassword = async (event: SubmitEvent<HTMLFormElement>, toEmail: string) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const code = normalizeResetCode(formText(formData, "code"))
    const newPassword = formText(formData, "newPassword")
    const problem = resetCodeProblem(code) ?? newPasswordProblem(newPassword)

    setNotice(null)

    if (problem) {
      setError(problem)

      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await signIn("password", {
        email: toEmail,
        code,
        newPassword,
        flow: RESET_VERIFICATION_FLOW,
      })
    } catch (caught) {
      setError(resetErrorMessage(caught))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sentToEmail === null) {
    return (
      <RequestCodeStep
        email={email}
        error={error}
        isSubmitting={isSubmitting}
        onEmailChange={setEmail}
        onSubmit={(event) => void requestCode(event)}
        onBack={onBack}
      />
    )
  }

  return (
    <NewPasswordStep
      email={sentToEmail}
      error={error}
      notice={notice}
      isSubmitting={isSubmitting}
      onSubmit={(event) => void resetPassword(event, sentToEmail)}
      onSendNewCode={() => void sendNewCode(sentToEmail)}
      onBack={onBack}
    />
  )
}

interface RequestCodeStepProps {
  email: string
  error: string | null
  isSubmitting: boolean
  onEmailChange: (email: string) => void
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void
  onBack: () => void
}

export function RequestCodeStep({
  email,
  error,
  isSubmitting,
  onEmailChange,
  onSubmit,
  onBack,
}: RequestCodeStepProps) {
  return (
    <Card narrow onSubmit={onSubmit}>
      <Eyebrow>{BRAND}</Eyebrow>
      <Heading level={HeadingLevel.Display}>Reset password</Heading>
      <Text tone={TextTone.Muted} size={TextSize.Small}>
        Enter the email you sign in with. We'll send you an {RESET_CODE_LENGTH}-digit code.
      </Text>
      <Field label="Email">
        <TextField
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          required
        />
      </Field>
      {error ? <Text tone={TextTone.Danger}>{error}</Text> : null}
      <Button type="submit" variant={ButtonVariant.Primary} disabled={isSubmitting}>
        Send code
      </Button>
      <Button variant={ButtonVariant.Link} onClick={onBack}>
        Back to sign in
      </Button>
    </Card>
  )
}

interface NewPasswordStepProps {
  email: string
  error: string | null
  notice: string | null
  isSubmitting: boolean
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void
  onSendNewCode: () => void
  onBack: () => void
}

export function NewPasswordStep({
  email,
  error,
  notice,
  isSubmitting,
  onSubmit,
  onSendNewCode,
  onBack,
}: NewPasswordStepProps) {
  return (
    <Card narrow onSubmit={onSubmit}>
      <Eyebrow>{BRAND}</Eyebrow>
      <Heading level={HeadingLevel.Display}>Check your email</Heading>
      <Text tone={TextTone.Muted} size={TextSize.Small}>
        We sent an {RESET_CODE_LENGTH}-digit code to {email}. Enter it and choose a new password.
      </Text>
      <TextField type="email" name="email" value={email} autoComplete="username" readOnly hidden />
      <Field label="Code">
        <TextField
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
        />
      </Field>
      <Field label="New password">
        <TextField name="newPassword" type="password" autoComplete="new-password" required />
      </Field>
      {error ? <Text tone={TextTone.Danger}>{error}</Text> : null}
      {notice ? (
        <Text tone={TextTone.Muted} size={TextSize.Small}>
          {notice}
        </Text>
      ) : null}
      <Button type="submit" variant={ButtonVariant.Primary} disabled={isSubmitting}>
        Set new password
      </Button>
      <Button variant={ButtonVariant.Link} onClick={onSendNewCode} disabled={isSubmitting}>
        Send a new code
      </Button>
      <Button variant={ButtonVariant.Link} onClick={onBack}>
        Back to sign in
      </Button>
    </Card>
  )
}
