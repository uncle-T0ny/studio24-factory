import { useState } from "react"
import { Badge } from "../Badge"
import { Button, ButtonVariant } from "../Button"
import { PageMessage } from "../EmptyState"
import { Field } from "../Field"
import {
  Card,
  CardElement,
  CardHeader,
  CenteredPage,
  FormRow,
  PageColumn,
  PageHeader,
} from "../Layout"
import { SegmentedControl } from "../SegmentedControl"
import { Eyebrow, Heading, HeadingLevel, Text, TextLink, TextSize, TextTone } from "../Text"
import { TextField } from "../TextField"
import { Tone, type Option } from "../types"
import { PAGE_PATH, KitSection, Specimen } from "./kitShared"

enum EntryStatus {
  New = "new",
  Done = "done",
}

const STATUS_OPTIONS: Option<EntryStatus>[] = [
  {
    value: EntryStatus.New,
    label: "New",
  },
  {
    value: EntryStatus.Done,
    label: "Done",
  },
]

function FeedbackCardSpecimen() {
  const [status, setStatus] = useState(EntryStatus.New)

  return (
    <Specimen label="Card article · CardHeader with actions · Text multiline (a feedback entry)">
      <Card element={CardElement.Article} label="Something's broken from owner@example.com">
        <CardHeader
          actions={
            <SegmentedControl
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={setStatus}
            />
          }
        >
          <Badge tone={Tone.Danger}>Something's broken</Badge>
          <Text size={TextSize.Small} inline>
            owner@example.com
          </Text>
        </CardHeader>
        <Text multiline>
          {"The export button does nothing.\nI was on the Spring launch project."}
        </Text>
      </Card>
    </Specimen>
  )
}

export function PagesSection() {
  return (
    <KitSection id="pages">
      <div className="kit-grid kit-grid--wide">
        <Specimen label="Eyebrow · Heading display, title, section">
          <Eyebrow>Brand name</Eyebrow>
          <Heading level={HeadingLevel.Display}>Projects</Heading>
          <Heading level={HeadingLevel.Title}>Spring launch</Heading>
          <Heading level={HeadingLevel.Section}>New project</Heading>
        </Specimen>
        <Specimen label="Text · tones · sizes · mono · TextLink">
          <Text>Default text</Text>
          <Text tone={TextTone.Muted} size={TextSize.Small}>
            Muted small: pick a project to open it.
          </Text>
          <Text tone={TextTone.Accent}>Accent text</Text>
          <Text tone={TextTone.Warning} mono size={TextSize.ExtraSmall}>
            Status: Draft → Ready
          </Text>
          <Text tone={TextTone.Danger}>Couldn't sign in.</Text>
          <TextLink to={PAGE_PATH}>Back to projects</TextLink>
        </Specimen>
        <Specimen label="PageHeader · Card with form · FormRow">
          <PageHeader eyebrow="Brand name" title="Projects" actions={<Button>Sign out</Button>} />
          <Card label="New project" onSubmit={(event) => event.preventDefault()}>
            <Heading level={HeadingLevel.Section}>New project</Heading>
            <FormRow>
              <Field label="Project name">
                <TextField placeholder="Spring launch" />
              </Field>
              <Field label="Due date">
                <TextField type="date" />
              </Field>
              <Button type="submit" variant={ButtonVariant.Primary}>
                New project
              </Button>
            </FormRow>
          </Card>
        </Specimen>
        <FeedbackCardSpecimen />
        <Specimen label="CenteredPage · Card narrow (sign-in)">
          <div className="kit-stage kit-stage--tall">
            <CenteredPage>
              <Card narrow>
                <Eyebrow>Brand name</Eyebrow>
                <Button variant={ButtonVariant.Primary}>Sign in</Button>
              </Card>
            </CenteredPage>
          </div>
        </Specimen>
        <Specimen label="PageColumn (projects page)">
          <div className="kit-stage kit-stage--tall">
            <PageColumn>
              <PageHeader title="Projects" />
            </PageColumn>
          </div>
        </Specimen>
        <Specimen label="PageMessage · loading · with title and action">
          <div className="kit-stage kit-stage--message">
            <PageMessage>Loading…</PageMessage>
          </div>
          <div className="kit-stage kit-stage--message">
            <PageMessage
              title="Page not found."
              action={<TextLink to={PAGE_PATH}>Back to projects</TextLink>}
            >
              This project doesn't exist or isn't yours.
            </PageMessage>
          </div>
        </Specimen>
      </div>
    </KitSection>
  )
}
