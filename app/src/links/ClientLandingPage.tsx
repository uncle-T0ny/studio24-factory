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

  const reached = STAGES.slice(0, STAGES.indexOf(link.stage) + 1)
  const latest = reached.findLast((stage) => link.stages.includes(stage))

  if (latest) {
    return <Navigate to={`/c/${token}/${latest}`} replace />
  }

  return (
    <PageMessage>
      {`This link opens a later stage. Your project is at the ${STAGE_LABELS[link.stage]} stage now: ask the developer for its link.`}
    </PageMessage>
  )
}
