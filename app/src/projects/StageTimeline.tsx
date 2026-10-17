import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { STAGES, type Stage } from "../../convex/lib/validators"
import { useErrorState } from "../lib/errors"
import { formatTimestamp } from "../lib/formatDate"
import { Card, Field, Heading, HeadingLevel, List, ListRow, Select, Text, TextTone } from "../ui"
import { STAGE_LABELS, STAGE_OPTIONS } from "./stages"

function stageMeta(stage: Stage, current: Stage, event: Doc<"stageEvents"> | undefined): string {
  const position = STAGES.indexOf(stage) - STAGES.indexOf(current)
  const since = position === 0 ? event?.startedAt : event?.doneAt
  const status = position < 0 ? "Done" : position === 0 ? "Now" : "Not started"

  return position <= 0 && since !== undefined ? `${status}, ${formatTimestamp(since)}` : status
}

export function StageTimeline({ project }: { project: Doc<"projects"> }) {
  const events = useQuery(api.projects.stageEvents, { projectId: project._id })
  const moveStage = useMutation(api.projects.moveStage)
  const { error, setError, showError } = useErrorState()

  const move = (stage: Stage) => {
    setError(null)
    moveStage({ projectId: project._id, stage }).catch(showError)
  }

  return (
    <Card label="Timeline">
      <Heading level={HeadingLevel.Section}>Timeline</Heading>
      <List label="Stages">
        {STAGES.map((stage) => (
          <ListRow
            key={stage}
            title={STAGE_LABELS[stage]}
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
