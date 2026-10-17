import { useAuthActions } from "@convex-dev/auth/react"
import { useConvex } from "convex/react"
import { useState, type SubmitEvent } from "react"
import { api } from "../../convex/_generated/api"
import type { AccountStatus } from "../../convex/lib/signIn"
import { APP_NAME, BRAND } from "../app.config"
import {
  Button,
  ButtonVariant,
  Card,
  CenteredPage,
  Eyebrow,
  Field,
  Heading,
  HeadingLevel,
  Text,
  TextField,
  TextTone,
} from "../ui"
import { PasswordReset } from "./PasswordReset"
import {
  AUTH_PROBLEM_ACTION_LABELS,
  AUTH_PROBLEM_MESSAGES,
  type AuthProblem,
  AuthProblemAction,
  authProblemAction,
  signInProblemOf,
  signUpProblemOf,
} from "./authProblems"

enum AuthFlow {
  SignIn = "signIn",
  SignUp = "signUp",
}

interface AuthProblemLineProps {
  problem: AuthProblem
  onAction: (action: AuthProblemAction) => void
}

function AuthProblemLine({ problem, onAction }: AuthProblemLineProps) {
  const action = authProblemAction(problem)

  return (
    <Text tone={TextTone.Danger} alert>
      {AUTH_PROBLEM_MESSAGES[problem]}
      {action ? (
        <>
          {" "}
          <Button variant={ButtonVariant.Link} onClick={() => onAction(action)}>
            {AUTH_PROBLEM_ACTION_LABELS[action]}
          </Button>
        </>
      ) : null}
    </Text>
  )
}

export function SignInPage() {
  const { signIn } = useAuthActions()
  const convex = useConvex()
  const [flow, setFlow] = useState(AuthFlow.SignIn)
  const [email, setEmail] = useState("")
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [problem, setProblem] = useState<AuthProblem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSignUp = flow === AuthFlow.SignUp
  const isResetOffered =
    problem !== null && authProblemAction(problem) === AuthProblemAction.ResetPassword

  const accountStatus = async (): Promise<AccountStatus | null> => {
    try {
      return await convex.query(api.accounts.status, {
        email,
      })
    } catch {
      return null
    }
  }

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    formData.set("flow", flow)
    setProblem(null)
    setIsSubmitting(true)

    try {
      await signIn("password", formData)
    } catch {
      const status = await accountStatus()

      setProblem(isSignUp ? signUpProblemOf(status) : signInProblemOf(status))
    } finally {
      setIsSubmitting(false)
    }
  }

  const startPasswordReset = () => {
    setProblem(null)
    setIsResettingPassword(true)
  }

  const switchFlow = (nextFlow: AuthFlow) => {
    setProblem(null)
    setFlow(nextFlow)
  }

  const handleProblemAction = (action: AuthProblemAction) => {
    switch (action) {
      case AuthProblemAction.CreateAccount:
        switchFlow(AuthFlow.SignUp)

        return
      case AuthProblemAction.SignIn:
        switchFlow(AuthFlow.SignIn)

        return
      case AuthProblemAction.ResetPassword:
        startPasswordReset()
    }
  }

  if (isResettingPassword) {
    return (
      <CenteredPage>
        <PasswordReset initialEmail={email} onBack={() => setIsResettingPassword(false)} />
      </CenteredPage>
    )
  }

  return (
    <CenteredPage>
      <Card narrow onSubmit={(event) => void submit(event)}>
        <Eyebrow>{BRAND}</Eyebrow>
        <Heading level={HeadingLevel.Display}>{APP_NAME}</Heading>
        <Field label="Email">
          <TextField
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <TextField
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </Field>
        {problem ? <AuthProblemLine problem={problem} onAction={handleProblemAction} /> : null}
        <Button type="submit" variant={ButtonVariant.Primary} disabled={isSubmitting}>
          {isSignUp ? "Sign up" : "Sign in"}
        </Button>
        {isSignUp || isResetOffered ? null : (
          <Button variant={ButtonVariant.Link} onClick={startPasswordReset}>
            Forgot password?
          </Button>
        )}
        <Button
          variant={ButtonVariant.Link}
          onClick={() => switchFlow(isSignUp ? AuthFlow.SignIn : AuthFlow.SignUp)}
        >
          {isSignUp ? "I have an account: sign in" : "First time here? Sign up"}
        </Button>
      </Card>
    </CenteredPage>
  )
}
