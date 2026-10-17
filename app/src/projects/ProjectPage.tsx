import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react"
import { Navigate, useParams } from "react-router-dom"
import { ProjectAssistant } from "./ProjectAssistant"
import { RenameForm } from "./RenameForm"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { BRAND } from "../app.config"
import { ExportButton } from "../backup/ExportButton"
import { projectBackup } from "../backup/projectBackup"
import { FeedbackButton } from "../feedback/FeedbackButton"
import { ShareButton } from "../share/ShareButton"
import { PageColumn, PageHeader, PageMessage, Text, TextLink, TextTone, Toolbar } from "../ui"

function OwnerProject({ project }: { project: Doc<"projects"> }) {
  return (
    <PageColumn>
      <PageHeader
        eyebrow={BRAND}
        title={project.name}
        actions={
          <Toolbar>
            <TextLink to="/">All projects</TextLink>
            <FeedbackButton target={{ projectId: project._id }} />
            <ExportButton adapter={projectBackup} id={project._id} />
            <ShareButton projectId={project._id} shareToken={project.shareToken} />
          </Toolbar>
        }
      />
      <Text tone={TextTone.Muted}>
        The example resource. Replace this page with your app's own screen.
      </Text>
      <RenameForm key={project.name} projectId={project._id} name={project.name} />
      <ProjectAssistant projectId={project._id} />
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

// /project/:id, the owner's page of one project.
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
