import { useAuthActions } from "@convex-dev/auth/react"
import { useState } from "react"
import { Button, ButtonVariant, Text, TextTone } from "../ui"

export function DemoSignIn() {
  const { signIn } = useAuthActions()
  const [isFailed, setIsFailed] = useState(false)

  const signInAsDemo = async () => {
    setIsFailed(false)

    try {
      await signIn("demo")
    } catch {
      setIsFailed(true)
    }
  }

  return (
    <>
      <Button variant={ButtonVariant.Secondary} onClick={() => void signInAsDemo()}>
        Demo as developer
      </Button>
      {isFailed ? (
        <Text tone={TextTone.Danger} alert>
          The demo isn't set up on this deployment.
        </Text>
      ) : null}
    </>
  )
}
