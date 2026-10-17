import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { STAGES, type Stage } from "../../convex/lib/validators"
import { useErrorState } from "../lib/errors"
import { formatTimestamp } from "../lib/formatDate"
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Heading,
  HeadingLevel,
  List,
  ListRow,
  Select,
  Text,
  TextTone,
  Tone,
} from "../ui"
import { nextStage, STAGE_LABELS, STAGE_OPTIONS } from "./stages"

function stageMeta(stage: Stage, current: Stage, event: Doc<"stageEvents"> | undefined): string {
  const position = STAGES.indexOf(stage) - STAGES.indexOf(current)

  if (position < 0) {
    return event?.doneAt === undefined ? "Done" : `Done ${formatTimestamp(event.doneAt)}`
  }

  if (position === 0) {
    return event?.startedAt === undefined ? "Now" : `Now, since ${formatTimestamp(event.startedAt)}`
  }

  return "Not started"
}

export function StageTimeline({ project }: { project: Doc<"projects"> }) {
  const events = useQuery(api.projects.stageEvents, { projectId: project._id })
  const moveStage = useMutation(api.projects.moveStage)
  const { error, setError, showError } = useErrorState()
  const next = nextStage(project.stage)

  const move = (stage: Stage) => {
    setError(null)
    moveStage({ projectId: project._id, stage }).catch(showError)
  }

  return (
    <Card label="Timeline">
      <CardHeader
        actions={
          next ? <Button onClick={() => move(next)}>Move to {STAGE_LABELS[next]}</Button> : null
        }
      >
        <Heading level={HeadingLevel.Section}>Timeline</Heading>
      </CardHeader>
      <List label="Stages">
        {STAGES.map((stage) => (
          <ListRow
            key={stage}
            title={
              stage === project.stage ? (
                <Badge tone={Tone.Accent}>{STAGE_LABELS[stage]}</Badge>
              ) : (
                STAGE_LABELS[stage]
              )
            }
            meta={stageMeta(
              stage,
              project.stage,
              events?.find((event) => event.stage === stage),
            )}
          />
        ))}
      </List>
      <Field label="Stage">
        <Select value={project.stage} options={STAGE_OPTIONS} onChange={move} />
      </Field>
      {error ? (
        <Text tone={TextTone.Danger} alert>
          {error}
        </Text>
      ) : null}
    </Card>
  )
}
