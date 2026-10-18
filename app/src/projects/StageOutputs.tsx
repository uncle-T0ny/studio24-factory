import { useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import type { ReactNode } from "react"
import { STAGE_LABELS } from "./stages"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { STAGES, type Stage } from "../../convex/lib/validators"
import { ChatTranscript } from "../interview/ChatTranscript"
import { Badge, Card, Heading, HeadingLevel, Text, TextSize, TextTone, Tone } from "../ui"
import "./stageOutputs.css"

type Outputs = FunctionReturnType<typeof api.stageOutputs.forProject>

const EXAMPLES: Record<Stage, string> = {
  interview: "Interviewer: What should the app do? You: Let my clients book a visit online.",
  prd: "5 functional requirements: Book a visit, Pay a deposit, Get a reminder…",
  analysis: "About 60 hours to build, about $25 a month to run.",
  prototype: "A clickable mockup of the main screens.",
  feedback: "Works: booking is quick. Broken: the date picker. Request: a waiting list.",
  final: "The finished app's link, behind a login.",
  transferred: "The code and the accounts, handed over.",
}

const FEEDBACK_TONES = { works: Tone.Accent, broken: Tone.Danger, request: Tone.Warning }

function output(stage: Stage, outputs: Outputs): ReactNode {
  const { turns, prd, estimate, prototype, feedback } = outputs

  switch (stage) {
    case "interview":
      return turns.length === 0 ? null : (
        <ChatTranscript
          label="The interview's first turns"
          lines={turns.map((turn) => ({
            key: String(turn.seq),
            speaker: turn.speaker,
            label: turn.speaker === "agent" ? "Interviewer" : "Client",
            text: turn.text,
          }))}
        />
      )
    case "prd":
      return (
        prd && <Text>{`${prd.frCount} functional requirements: ${prd.titles.join(", ")}`}</Text>
      )
    case "analysis":
      return estimate && <Text>{`${estimate.hours} hours · $${estimate.monthlyUsd} a month`}</Text>
    case "prototype":
      return (
        prototype && (
          <>
            <div className="stage-output-frame">
              <iframe
                title="Prototype preview"
                src={prototype.url}
                sandbox={prototype.kind === "mockup" ? "allow-scripts" : undefined}
              />
            </div>
            <a className="ui-text-link" href={prototype.url} target="_blank" rel="noreferrer">
              Open the prototype
            </a>
          </>
        )
      )
    case "feedback":
      return feedback.length === 0 ? null : (
        <div className="stage-output-badges">
          {feedback.map((item) => (
            <Badge key={`${item.kind}-${item.text}`} tone={FEEDBACK_TONES[item.kind]}>
              {`${item.kind}: ${item.text}`}
            </Badge>
          ))}
        </div>
      )
    default:
      return null
  }
}

export function StageOutputs({ project }: { project: Doc<"projects"> }) {
  const outputs = useQuery(api.stageOutputs.forProject, { projectId: project._id })

  if (!outputs) {
    return null
  }

  return (
    <Card label="Stage outputs">
      <Heading level={HeadingLevel.Section}>What each stage made</Heading>
      {STAGES.map((stage) => {
        const isReached = STAGES.indexOf(stage) <= STAGES.indexOf(project.stage)
        const made = isReached ? output(stage, outputs) : null

        return (
          <section key={stage} className="stage-output" aria-label={STAGE_LABELS[stage]}>
            <Text size={TextSize.Small} tone={TextTone.Muted}>
              {made ? STAGE_LABELS[stage] : `${STAGE_LABELS[stage]} · Example`}
            </Text>
            {made ?? <Text tone={TextTone.Muted}>{EXAMPLES[stage]}</Text>}
          </section>
        )
      })}
    </Card>
  )
}
