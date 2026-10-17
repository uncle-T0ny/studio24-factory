import { useQuery } from "convex/react"
import { Navigate, useParams } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import { STAGES } from "../../convex/lib/validators"
import { STAGE_LABELS } from "../projects/stages"
import { PageMessage } from "../ui"

export function ClientLandingPage() {
  const token = useParams().token ?? ""
  const link = useQuery(api.links.open, { token })

  if (link === undefined) {
    return <PageMessage>Loading…</PageMessage>
  }

  if (link === null) {
    return (
      <PageMessage>This link isn't valid any more. Ask the developer for a new one.</PageMessage>
    )
  }

  const reached = STAGES.filter(
    (stage) => link.stages.includes(stage) && STAGES.indexOf(stage) <= STAGES.indexOf(link.stage),
  )
  const latest = reached.at(-1)

  if (latest) {
    return <Navigate to={`/c/${token}/${latest}`} replace />
  }

  const opens = link.stages.map((stage) => STAGE_LABELS[stage]).join(", ")

  return (
    <PageMessage>
      {`${link.clientName}, your project is now at the ${STAGE_LABELS[link.stage]} stage, and this link opens only: ${opens}. Ask the developer for the link to ${STAGE_LABELS[link.stage]}.`}
    </PageMessage>
  )
}
