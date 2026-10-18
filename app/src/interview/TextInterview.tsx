import { useMutation } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { useState, type SubmitEvent } from "react"
import { api } from "../../convex/_generated/api"
import { RECORDED_MODEL } from "../../convex/lib/llm"
import { useErrorState } from "../lib/errors"
import {
  Badge,
  Button,
  ButtonRow,
  ButtonVariant,
  Callout,
  Card,
  Field,
  Text,
  TextArea,
  TextTone,
  Tone,
} from "../ui"
import "../voice/voice.css"
import "./interview.css"

export type InterviewView = NonNullable<FunctionReturnType<typeof api.interviews.current>>

function Status({ view, isAwaiting }: { view: InterviewView; isAwaiting: boolean }) {
  switch (view.status) {
    case "done":
      return (
        <Callout tone={Tone.Accent} title="Thanks, the interview is done.">
          <Text>The developer turns it into your app's requirements.</Text>
        </Callout>
      )
    case "failed":
      return (
        <Text tone={TextTone.Danger} alert>
          The interview stopped. Ask the developer for help.
        </Text>
      )
    default:
      return isAwaiting ? null : <Badge>Thinking…</Badge>
  }
}

export function TextInterview({ token, view }: { token: string; view: InterviewView }) {
  const answer = useMutation(api.interviews.answer)
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { error, setError, showError } = useErrorState()
  const isAwaiting = view.status === "live" && view.turns.at(-1)?.speaker === "agent"
  const interviewer = view.isRecorded ? `Interviewer · ${RECORDED_MODEL}` : "Interviewer"

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSending(true)

    try {
      await answer({ token, interviewId: view.interviewId, text: draft })
      setDraft("")
    } catch (caught) {
      showError(caught)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card label="Interview">
      <ol className="interview-chat" aria-label="Transcript">
        {view.turns
          .filter((turn) => turn.text.trim())
          .map((turn) => (
            <li key={turn.seq} className={`interview-turn interview-turn--${turn.speaker}`}>
              <span className="interview-speaker">
                {turn.speaker === "agent" ? interviewer : "You"}
              </span>
              <p className="interview-bubble">{turn.text}</p>
            </li>
          ))}
      </ol>
      <Status view={view} isAwaiting={isAwaiting} />
      {isAwaiting ? (
        <form
          className="voice-typed"
          aria-label="Your answer"
          onSubmit={(event) => void submit(event)}
        >
          <Field label="Your answer">
            <TextArea value={draft} required onChange={(event) => setDraft(event.target.value)} />
          </Field>
          <ButtonRow>
            <Button type="submit" variant={ButtonVariant.Primary} disabled={isSending}>
              Send
            </Button>
            {view.sampleAnswer === null ? null : (
              <Button onClick={() => setDraft(view.sampleAnswer ?? "")}>
                Use the sample answer
              </Button>
            )}
          </ButtonRow>
          {error ? (
            <Text tone={TextTone.Danger} alert>
              {error}
            </Text>
          ) : null}
        </form>
      ) : null}
    </Card>
  )
}
