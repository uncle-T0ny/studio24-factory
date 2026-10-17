import { useAuthActions } from "@convex-dev/auth/react"
import { useMutation, useQuery } from "convex/react"
import { useState, type SubmitEvent } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { BRAND } from "../app.config"
import { ImportCard } from "../backup/ImportCard"
import { projectBackup } from "../backup/projectBackup"
import { FeedbackButton } from "../feedback/FeedbackButton"
import { useErrorState, useErrorToast } from "../lib/errors"
import { formatTimestamp } from "../lib/formatDate"
import {
  Button,
  ButtonVariant,
  Card,
  EmptyState,
  Field,
  FormRow,
  Heading,
  HeadingLevel,
  List,
  ListRow,
  PageColumn,
  PageHeader,
  Text,
  TextField,
  TextLink,
  TextTone,
  Toast,
  Tone,
  Toolbar,
} from "../ui"

const DELETE_ERROR_VISIBLE_MS = 5000

function NewProjectForm() {
  const createProject = useMutation(api.projects.create)
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const { error, setError, showError } = useErrorState()

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const projectId = await createProject({ name })

      void navigate(`/project/${projectId}`)
    } catch (caught) {
      showError(caught)
    }
  }

  return (
    <Card label="New project" onSubmit={(event) => void submit(event)}>
      <Heading level={HeadingLevel.Section}>New project</Heading>
      <FormRow>
        <Field label="Project name">
          <TextField
            placeholder="Spring launch"
            value={name}
            required
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Button type="submit" variant={ButtonVariant.Primary}>
          New project
        </Button>
      </FormRow>
      {error ? (
        <Text tone={TextTone.Danger} alert>
          {error}
        </Text>
      ) : null}
    </Card>
  )
}

interface ProjectRowProps {
  project: Doc<"projects">
  onDeleteError: (caught: unknown) => void
}

function ProjectRow({ project, onDeleteError }: ProjectRowProps) {
  const removeProject = useMutation(api.projects.remove)

  const remove = () => {
    const isConfirmed = window.confirm(`Delete "${project.name}"?`)

    if (isConfirmed) {
      removeProject({ projectId: project._id }).catch(onDeleteError)
    }
  }

  return (
    <ListRow
      to={`/project/${project._id}`}
      title={project.name}
      meta={`Created ${formatTimestamp(project._creationTime)}`}
      actions={
        <Button variant={ButtonVariant.Danger} onClick={remove}>
          Delete
        </Button>
      }
    />
  )
}

export function ProjectsPage() {
  const { signOut } = useAuthActions()
  const projects = useQuery(api.projects.listMine)
  const { error: deleteError, showError: showDeleteError } = useErrorToast(DELETE_ERROR_VISIBLE_MS)

  return (
    <PageColumn>
      <PageHeader
        eyebrow={BRAND}
        title="Projects"
        actions={
          <Toolbar>
            <TextLink to="/feedback">All feedback</TextLink>
            <FeedbackButton />
            <Button onClick={() => void signOut()}>Sign out</Button>
          </Toolbar>
        }
      />
      <NewProjectForm />
      <ImportCard adapter={projectBackup} />
      {projects === undefined ? <EmptyState>Loading…</EmptyState> : null}
      {projects?.length === 0 ? <EmptyState>No projects yet.</EmptyState> : null}
      <List label="Projects">
        {projects?.map((project) => (
          <ProjectRow key={project._id} project={project} onDeleteError={showDeleteError} />
        ))}
      </List>
      {deleteError ? (
        <Toast tone={Tone.Danger} fixed>
          {deleteError}
        </Toast>
      ) : null}
    </PageColumn>
  )
}
