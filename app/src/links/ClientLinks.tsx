import { useMutation, useQuery } from "convex/react"
import { useState, type SubmitEvent } from "react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import type { Stage } from "../../convex/lib/validators"
import { useErrorState } from "../lib/errors"
import { formatTimestamp } from "../lib/formatDate"
import { STAGE_LABELS, STAGE_OPTIONS } from "../projects/stages"
import {
  Button,
  ButtonVariant,
  Card,
  Field,
  FormRow,
  Heading,
  HeadingLevel,
  List,
  ListRow,
  Select,
  Text,
  TextField,
  TextTone,
} from "../ui"

const LINKABLE_STAGES = STAGE_OPTIONS.filter((option) => option.value !== "transferred")

function linkUrl(token: string): string {
  return `${window.location.origin}/c/${token}`
}

function LinkRow({ link }: { link: Doc<"clientLinks"> }) {
  const revoke = useMutation(api.links.revoke)
  const { error, showError } = useErrorState()
  const stages = link.stages.map((stage) => STAGE_LABELS[stage]).join(", ")
  const state =
    link.revokedAt === undefined ? "Active" : `Revoked ${formatTimestamp(link.revokedAt)}`

  return (
    <ListRow
      title={stages}
      meta={error ?? `${state}. Created ${formatTimestamp(link._creationTime)}`}
      actions={
        link.revokedAt === undefined ? (
          <Button
            variant={ButtonVariant.Danger}
            onClick={() => void revoke({ linkId: link._id }).catch(showError)}
          >
            Revoke
          </Button>
        ) : null
      }
    />
  )
}

export function ClientLinks({ project }: { project: Doc<"projects"> }) {
  const links = useQuery(api.links.listForProject, { projectId: project._id })
  const createLink = useMutation(api.links.create)
  const [stage, setStage] = useState<Stage>(project.stage)
  const [newUrl, setNewUrl] = useState<string | null>(null)
  const { error, setError, showError } = useErrorState()

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const { token } = await createLink({ projectId: project._id, stages: [stage] })

      setNewUrl(linkUrl(token))
    } catch (caught) {
      showError(caught)
    }
  }

  return (
    <Card label="Client links" onSubmit={(event) => void submit(event)}>
      <Heading level={HeadingLevel.Section}>Client links</Heading>
      <FormRow>
        <Field label="Opens the stage">
          <Select value={stage} options={LINKABLE_STAGES} onChange={setStage} />
        </Field>
        <Button type="submit" variant={ButtonVariant.Primary}>
          New link
        </Button>
      </FormRow>
      {newUrl ? (
        <Field label="New link, shown once: send it to the client">
          <TextField value={newUrl} readOnly mono onFocus={(event) => event.target.select()} />
        </Field>
      ) : null}
      {error ? (
        <Text tone={TextTone.Danger} alert>
          {error}
        </Text>
      ) : null}
      <List label="Links">
        {links?.map((link) => (
          <LinkRow key={link._id} link={link} />
        ))}
      </List>
    </Card>
  )
}
