import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react"
import { Navigate, useParams } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { ExportButton } from "../backup/ExportButton"
import { projectBackup } from "../backup/projectBackup"
import { FeedbackButton } from "../feedback/FeedbackButton"
import { ClientLinks } from "../links/ClientLinks"
import { PageColumn, PageHeader, PageMessage, TextLink, Toolbar } from "../ui"
import { StageTimeline } from "./StageTimeline"

function OwnerProject({ project }: { project: Doc<"projects"> }) {
  return (
    <PageColumn>
      <PageHeader
        eyebrow={project.clientName}
        title={project.title}
        actions={
          <Toolbar>
            <TextLink to="/">All projects</TextLink>
            <FeedbackButton target={{ projectId: project._id }} />
            <ExportButton adapter={projectBackup} id={project._id} />
          </Toolbar>
        }
      />
      <StageTimeline project={project} />
      <ClientLinks key={project.stage} project={project} />
    </PageColumn>
  )
}

function OwnerProjectLoader({ projectId }: { projectId: string }) {
  const project = useQuery(api.projects.get, { projectId })

  if (project === undefined) {
    return <PageMessage>Loading…</PageMessage>
  }

  if (project === null) {
    return (
      <PageMessage action={<TextLink to="/">Back to projects</TextLink>}>
        This project doesn't exist or isn't yours.
      </PageMessage>
    )
  }

  return <OwnerProject project={project} />
}

export function ProjectPage() {
  const { id } = useParams()

  return (
    <>
      <AuthLoading>
        <PageMessage>Loading…</PageMessage>
      </AuthLoading>
      <Unauthenticated>
        <Navigate to="/" replace />
      </Unauthenticated>
      <Authenticated>
        <OwnerProjectLoader projectId={id ?? ""} />
      </Authenticated>
    </>
  )
}
