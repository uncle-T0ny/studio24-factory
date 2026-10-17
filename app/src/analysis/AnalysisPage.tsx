import { useAction, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { useParams } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import { RecordedNote, RunButton } from "../prd/RunButton"
import { Badge, MetaList, PageColumn, PageHeader, Section, Text, TextTone, Tone } from "../ui"

type EstimateView = NonNullable<FunctionReturnType<typeof api.estimates.forClient>>

const VERDICT_LABEL = {
  inTemplate: "in the template",
  extension: "extension",
  notSupported: "not supported",
}

function usd(amount: number): string {
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`
}

function EstimateBody({ estimate, templateName, verdicts, recorded }: EstimateView) {
  return (
    <>
      {recorded && <RecordedNote />}
      <MetaList
        entries={[
          { label: "Template", value: templateName },
          { label: "Hours", value: estimate.totalHours },
          { label: "Infrastructure", value: `${usd(estimate.infraMonthlyUsd)} a month` },
        ]}
      />
      <Section label="Verdicts" divided>
        {verdicts.map((verdict) => (
          <Section
            key={verdict._id}
            title={
              <>
                {verdict.requirement?.code} {verdict.requirement?.title}{" "}
                <Badge tone={verdict.verdict === "notSupported" ? Tone.Warning : Tone.Neutral}>
                  {VERDICT_LABEL[verdict.verdict]}
                </Badge>{" "}
                {verdict.hours} h, +{usd(verdict.infraMonthlyUsd)} a month
              </>
            }
            compact
          >
            <Text>{verdict.rationale}</Text>
            {verdict.alternative && (
              <Text tone={TextTone.Accent}>Instead: {verdict.alternative}</Text>
            )}
          </Section>
        ))}
      </Section>
      <Section label="Where the free tiers break" divided>
        {estimate.freeTierBreaks.map((jump) => (
          <Section key={jump.service + jump.limit} title={`${jump.service}: ${jump.limit}`} compact>
            <Text>
              At {jump.atUsage}: +{usd(jump.extraUsd)} a month. {jump.reason}
            </Text>
          </Section>
        ))}
      </Section>
      <Section label="Assumptions" divided>
        {estimate.assumptions.map((assumption) => (
          <Text key={assumption}>{assumption}</Text>
        ))}
      </Section>
    </>
  )
}

export function AnalysisPage() {
  const token = useParams().token ?? ""
  const view = useQuery(api.estimates.forClient, { token })
  const run = useAction(api.estimates.run)

  return (
    <PageColumn>
      <PageHeader
        title="Template analysis and estimate"
        actions={
          view !== undefined && (
            <RunButton label={view ? "Run again" : "Run the analysis"} run={() => run({ token })} />
          )
        }
      />
      {view === null && (
        <Text tone={TextTone.Muted}>No estimate yet: run the analysis on the PRD.</Text>
      )}
      {view && <EstimateBody {...view} />}
    </PageColumn>
  )
}
