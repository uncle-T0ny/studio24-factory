import { useMutation, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { useState, type SubmitEvent } from "react"
import { useParams } from "react-router-dom"
import { VoiceNote } from "./VoiceNote"
import { api } from "../../convex/_generated/api"
import { useErrorState } from "../lib/errors"
import { PrototypeFrame } from "../prototype/PrototypeFrame"
import {
  Badge,
  Button,
  ButtonVariant,
  Card,
  CardElement,
  Field,
  Heading,
  HeadingLevel,
  PageColumn,
  PageHeader,
  PageMessage,
  Text,
  TextArea,
  TextTone,
  Tone,
} from "../ui"

type Feedback = FunctionReturnType<typeof api.clientFeedback.forClient>["feedback"][number]

const ITEM_LABELS = {
  works: { label: "Works", tone: Tone.Accent },
  broken: { label: "Broken", tone: Tone.Danger },
  request: { label: "Request", tone: Tone.Warning },
}

export function ClientFeedbackPage() {
  const token = useParams().token ?? ""
  const page = useQuery(api.clientFeedback.forClient, { token })
  const isVoiceEnabled = useQuery(api.clientFeedback.voiceEnabled)

  if (page === undefined || isVoiceEnabled === undefined) {
    return <PageMessage>Loading…</PageMessage>
  }

  return (
    <PageColumn>
      <PageHeader title="Your feedback" />
      <PrototypeFrame prototype={page.prototype} />
      {page.prototype ? <WrittenFeedback token={token} /> : null}
      {page.prototype && isVoiceEnabled ? <VoiceNote token={token} /> : null}
      {page.feedback.map((feedback) => (
        <FeedbackCard key={feedback._id} feedback={feedback} isRecorded={!isVoiceEnabled} />
      ))}
    </PageColumn>
  )
}

function WrittenFeedback({ token }: { token: string }) {
  const submitText = useMutation(api.clientFeedback.submitText)
  const [text, setText] = useState("")
  const { error, setError, showError } = useErrorState()

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      await submitText({ token, text })
      setText("")
    } catch (caught) {
      showError(caught)
    }
  }

  return (
    <Card label="Written feedback" onSubmit={(event) => void submit(event)}>
      <Field label="What works, what's broken, what would you change?" error={error ?? undefined}>
        <TextArea
          rows={5}
          value={text}
          required
          onChange={(event) => setText(event.target.value)}
        />
      </Field>
      <Button type="submit" variant={ButtonVariant.Primary}>
        Send feedback
      </Button>
    </Card>
  )
}

function FeedbackCard({ feedback, isRecorded }: { feedback: Feedback; isRecorded: boolean }) {
  return (
    <Card label="Feedback sent" element={CardElement.Article}>
      <Heading level={HeadingLevel.Section}>
        {feedback.mode === "voice" ? "Your voice note" : "Your written feedback"}
      </Heading>
      {feedback.transcript ? <Text tone={TextTone.Muted}>{feedback.transcript}</Text> : null}
      {feedback.status === "pending" ? <Text>Sorting your feedback…</Text> : null}
      {feedback.status === "failed" ? (
        <Text tone={TextTone.Danger}>
          We couldn't sort this feedback. The developer still has it.
        </Text>
      ) : null}
      {feedback.status === "done" ? (
        <ul aria-label="What we heard">
          {feedback.items.map((item) => (
            <li key={`${item.kind}-${item.text}`}>
              <Badge tone={ITEM_LABELS[item.kind].tone}>{ITEM_LABELS[item.kind].label}</Badge>{" "}
              {item.text}
            </li>
          ))}
        </ul>
      ) : null}
      {feedback.status === "done" && isRecorded ? <Badge>recorded demo answer</Badge> : null}
    </Card>
  )
}
