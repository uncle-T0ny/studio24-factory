import { useAction, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { useParams } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import { Badge, Callout, Chip, PageColumn, PageHeader, Section, Text, TextTone, Tone } from "../ui"
import { RecordedNote, RunButton } from "./RunButton"

type PrdView = NonNullable<FunctionReturnType<typeof api.prd.forClient>>
type Requirement = PrdView["requirements"][number]

function Quotes({ quotes }: { quotes: Requirement["quotes"] }) {
  return quotes.map((quote, index) => (
    <Text key={index} tone={quote.verified ? TextTone.Muted : TextTone.Warning}>
      <Chip tone={quote.verified ? Tone.Neutral : Tone.Warning}>
        {quote.verified ? "verified" : "unverified"}
      </Chip>{" "}
      "{quote.text}"
    </Text>
  ))
}

function Requirements({ title, items }: { title: string; items: Requirement[] }) {
  return (
    <Section label={title} divided>
      {items.map((requirement) => (
        <Section
          key={requirement._id}
          title={
            <>
              {requirement.code} {requirement.title} <Badge>{requirement.priority}</Badge>
            </>
          }
          compact
        >
          <Text>{requirement.detail}</Text>
          <Quotes quotes={requirement.quotes} />
        </Section>
      ))}
    </Section>
  )
}

function PrdBody({ prd, requirements, decisions, recorded }: PrdView) {
  return (
    <>
      {recorded && <RecordedNote />}
      {!prd.validation.ok && (
        <Callout tone={Tone.Danger} title="This draft failed validation twice">
          Shown as the model returned it, not fixed: {prd.validation.problems.join(" ")}
        </Callout>
      )}
      <Text>{prd.summary}</Text>
      <Requirements
        title="Functional requirements"
        items={requirements.filter((requirement) => requirement.kind === "FR")}
      />
      <Requirements
        title="Non-functional requirements"
        items={requirements.filter((requirement) => requirement.kind === "NFR")}
      />
      <Section label="Out of scope" divided>
        <Text>{prd.outOfScope.join(", ")}</Text>
      </Section>
      <Section label="Decisions" divided>
        {decisions.map((decision) => (
          <Text key={decision._id}>{decision.text}</Text>
        ))}
      </Section>
    </>
  )
}

export function PrdPage() {
  const token = useParams().token ?? ""
  const view = useQuery(api.prd.forClient, { token })
  const draft = useAction(api.prd.draft)

  return (
    <PageColumn>
      <PageHeader
        title="The PRD"
        actions={
          view !== undefined && (
            <RunButton
              label={view ? "Draft again" : "Draft the PRD"}
              run={() => draft({ token })}
            />
          )
        }
      />
      {view === null && <Text tone={TextTone.Muted}>No PRD yet: draft it from the interview.</Text>}
      {view && <PrdBody {...view} />}
    </PageColumn>
  )
}
