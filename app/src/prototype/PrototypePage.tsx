import { useQuery } from "convex/react"
import { useParams } from "react-router-dom"
import { PrototypeFrame } from "./PrototypeFrame"
import { api } from "../../convex/_generated/api"
import { PageColumn, PageHeader, PageMessage } from "../ui"

export function PrototypePage() {
  const token = useParams().token ?? ""
  const prototype = useQuery(api.prototypes.forClient, { token })

  if (prototype === undefined) {
    return <PageMessage>Loading…</PageMessage>
  }

  return (
    <PageColumn>
      <PageHeader title="Prototype" />
      <PrototypeFrame prototype={prototype} />
    </PageColumn>
  )
}
