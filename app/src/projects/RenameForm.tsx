import { useMutation } from "convex/react"
import { useState, type SubmitEvent } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useErrorState } from "../lib/errors"
import { useTimedState } from "../lib/useTimedState"
import {
  Button,
  ButtonVariant,
  Card,
  Field,
  FormRow,
  Heading,
  HeadingLevel,
  Text,
  TextField,
  TextSize,
  TextTone,
} from "../ui"

const SAVED_VISIBLE_MS = 3000

export interface RenameFormProps {
  projectId: Id<"projects">
  name: string
  // A guest's token from the share link; the owner has none.
  shareToken?: string
}

// Renames the project, for the owner or a guest with the share link: projects.rename is a
// projectMutation, so the server checks either one.
export function RenameForm({ projectId, name, shareToken }: RenameFormProps) {
  const rename = useMutation(api.projects.rename)
  const [draft, setDraft] = useState(name)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useTimedState(false, SAVED_VISIBLE_MS)
  const { error, setError, showError } = useErrorState()

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      await rename({ projectId, name: draft, shareToken })
      setIsSaved(true)
    } catch (caught) {
      showError(caught)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card label="Rename project" onSubmit={(event) => void submit(event)}>
      <Heading level={HeadingLevel.Section}>Rename</Heading>
      <FormRow>
        <Field label="Project name">
          <TextField value={draft} required onChange={(event) => setDraft(event.target.value)} />
        </Field>
        <Button type="submit" variant={ButtonVariant.Primary} disabled={isSaving}>
          Save
        </Button>
      </FormRow>
      {isSaved ? (
        <Text tone={TextTone.Accent} size={TextSize.Small}>
          Saved.
        </Text>
      ) : null}
      {error ? (
        <Text tone={TextTone.Danger} alert>
          {error}
        </Text>
      ) : null}
    </Card>
  )
}
