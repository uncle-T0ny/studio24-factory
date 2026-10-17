import { useMutation } from "convex/react"
import { useRef, useState } from "react"
import { recordingToWav } from "./recordingToWav"
import { api } from "../../convex/_generated/api"
import { MAX_VOICE_FEEDBACK_SEC } from "../../convex/lib/usage"
import { UserError, useErrorState } from "../lib/errors"
import { uploadFile } from "../lib/upload"
import { Button, ButtonVariant, Card, Heading, HeadingLevel, Text, TextTone } from "../ui"

const MIC_BLOCKED = "Allow the microphone to record a voice note, or write your feedback."
const UPLOAD_FAILED = "The voice note didn't upload. Try again."

enum RecorderState {
  Idle = "idle",
  Recording = "recording",
  Sending = "sending",
}

export function VoiceNote({ token }: { token: string }) {
  const generateUploadUrl = useMutation(api.clientFeedback.generateUploadUrl)
  const submitVoice = useMutation(api.clientFeedback.submitVoice)
  const [state, setState] = useState(RecorderState.Idle)
  const recorder = useRef<MediaRecorder | null>(null)
  const stopTimer = useRef<number | undefined>(undefined)
  const { error, setError, showError } = useErrorState()

  const send = async (recording: Blob) => {
    try {
      const wav = await recordingToWav(recording, MAX_VOICE_FEEDBACK_SEC)
      const uploadUrl = await generateUploadUrl({ token })
      const audioFileId = await uploadFile(uploadUrl, wav, UPLOAD_FAILED)

      await submitVoice({ token, audioFileId })
    } catch (caught) {
      showError(caught)
    } finally {
      setState(RecorderState.Idle)
    }
  }

  const stop = () => {
    window.clearTimeout(stopTimer.current)
    recorder.current?.stop()
    recorder.current = null
    setState(RecorderState.Sending)
  }

  const start = async () => {
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks: Blob[] = []
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => chunks.push(event.data)
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        void send(new Blob(chunks, { type: mediaRecorder.mimeType }))
      }
      mediaRecorder.start()
      recorder.current = mediaRecorder
      stopTimer.current = window.setTimeout(stop, MAX_VOICE_FEEDBACK_SEC * 1000)
      setState(RecorderState.Recording)
    } catch (caught) {
      showError(caught instanceof DOMException ? new UserError(MIC_BLOCKED) : caught)
    }
  }

  return (
    <Card label="Voice note">
      <Heading level={HeadingLevel.Section}>Or say it</Heading>
      <Text tone={TextTone.Muted}>
        Up to {MAX_VOICE_FEEDBACK_SEC / 60} minutes. We turn it into text and sort it.
      </Text>
      {state === RecorderState.Recording ? (
        <Button variant={ButtonVariant.Danger} onClick={stop}>
          Stop and send
        </Button>
      ) : (
        <Button
          variant={ButtonVariant.Primary}
          disabled={state === RecorderState.Sending}
          onClick={() => void start()}
        >
          {state === RecorderState.Sending ? "Sending…" : "Record a voice note"}
        </Button>
      )}
      {error ? (
        <Text tone={TextTone.Danger} alert>
          {error}
        </Text>
      ) : null}
    </Card>
  )
}
