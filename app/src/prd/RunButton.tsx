import { useState } from "react"
import { useErrorState } from "../lib/errors"
import { Button, ButtonVariant, Text, TextTone } from "../ui"

export function RunButton({ label, run }: { label: string; run: () => Promise<unknown> }) {
  const [busy, setBusy] = useState(false)
  const { error, setError, showError } = useErrorState()

  const onClick = () => {
    setBusy(true)
    setError(null)
    run()
      .catch(showError)
      .finally(() => setBusy(false))
  }

  return (
    <>
      <Button variant={ButtonVariant.Primary} disabled={busy} onClick={onClick}>
        {busy ? "Working..." : label}
      </Button>
      {error && (
        <Text tone={TextTone.Danger} alert>
          {error}
        </Text>
      )}
    </>
  )
}

export function RecordedNote() {
  return (
    <Text tone={TextTone.Muted}>
      Recorded demo answer: this deployment has no OPENROUTER_API_KEY, so the model's answer was
      recorded on the sample interview.
    </Text>
  )
}
