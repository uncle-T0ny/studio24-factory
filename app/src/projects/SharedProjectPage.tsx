import { useQuery } from "convex/react"
import { useParams } from "react-router-dom"
import { ProjectAssistant } from "./ProjectAssistant"
import { RenameForm } from "./RenameForm"
import { api } from "../../convex/_generated/api"
import { APP_NAME } from "../app.config"
import { PageColumn, PageHeader, PageMessage, Text, TextTone } from "../ui"

// /p/:token, the share link: a guest opens one project with no account. Every call passes the
// token, and the server checks it (lib/access.ts).
export function SharedProjectPage() {
  const { token } = useParams()
  const shareToken = token ?? ""
  const project = useQuery(api.projects.getByShareToken, { shareToken })

  if (project === undefined) {
    return <PageMessage>Loading…</PageMessage>
  }

  if (project === null) {
    return <PageMessage>This link doesn't work any more. Ask for a new one.</PageMessage>
  }

  return (
    <PageColumn>
      <PageHeader eyebrow={APP_NAME} title={project.name} />
      <Text tone={TextTone.Muted}>You opened this project with a share link.</Text>
      <RenameForm
        key={project.name}
        projectId={project._id}
        name={project.name}
        shareToken={shareToken}
      />
      <ProjectAssistant projectId={project._id} shareToken={shareToken} />
    </PageColumn>
  )
}
