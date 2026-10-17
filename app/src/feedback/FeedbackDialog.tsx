import { useCallback, useEffect, useState, type SubmitEvent } from "react"
import { contextSummary, currentContext, type FeedbackTarget } from "./context"
import {
  formatBytes,
  pastedImage,
  prepareScreenshot,
  SCREENSHOT_ACCEPT,
  type PreparedScreenshot,
} from "./screenshot"
import { useSendFeedback } from "./useSendFeedback"
import {
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_TYPES,
  FeedbackType,
  MAX_MESSAGE_LENGTH,
} from "../../convex/lib/feedback"
import { useErrorState, type ErrorState } from "../lib/errors"
import { currentPlatform, isTypingTarget, Platform } from "../lib/platform"
import {
  Button,
  ButtonVariant,
  Dialog,
  Field,
  ImageInput,
  SegmentedControl,
  Text,
  TextArea,
  TextSize,
  TextTone,
  type Option,
} from "../ui"

const DIALOG_TITLE = "Send feedback"
const MESSAGE_ROWS = 6
const NO_MESSAGE = "Write a message first."

const TYPE_OPTIONS: Option<FeedbackType>[] = FEEDBACK_TYPES.map((type) => ({
  value: type,
  label: FEEDBACK_TYPE_LABELS[type],
}))

const PLACEHOLDERS: Record<FeedbackType, string> = {
  [FeedbackType.Broken]: "What did you do, what happened, and what did you expect instead?",
  [FeedbackType.Feature]: "What would you like the app to do?",
  [FeedbackType.Question]: "What would you like to know?",
}

interface Attachment extends PreparedScreenshot {
  url: string
}

function clipboardFiles(data: DataTransfer): File[] {
  if (data.files.length > 0) {
    return Array.from(data.files)
  }

  return Array.from(data.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
}

function pasteHint(): string {
  const keys = currentPlatform() === Platform.Mac ? "⌘V" : "Ctrl+V"

  return `Paste a screenshot with ${keys}, or choose a PNG or JPG.`
}

interface ScreenshotState {
  screenshot: Attachment | null
  isPreparing: boolean
  attach: (file: File) => Promise<void>
  remove: () => void
}

// The optional screenshot: a chosen file, or an image pasted anywhere while the dialog is open.
function useScreenshot(
  setError: ErrorState["setError"],
  showError: ErrorState["showError"],
): ScreenshotState {
  const [screenshot, setScreenshot] = useState<Attachment | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)

  useEffect(() => {
    if (!screenshot) {
      return
    }

    return () => URL.revokeObjectURL(screenshot.url)
  }, [screenshot])

  const attach = useCallback(
    async (file: File) => {
      setError(null)
      setIsPreparing(true)

      try {
        const prepared = await prepareScreenshot(file)

        setScreenshot({
          ...prepared,
          url: URL.createObjectURL(prepared.blob),
        })
      } catch (caught) {
        showError(caught)
      } finally {
        setIsPreparing(false)
      }
    },
    [setError, showError],
  )

  // A paste anywhere while the dialog is open: an image on the clipboard becomes the screenshot.
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const data = event.clipboardData

      if (!data) {
        return
      }

      const image = pastedImage({
        files: clipboardFiles(data),
        hasText: data.getData("text/plain").length > 0,
        isTextTarget: isTypingTarget(event.target),
      })

      if (!image) {
        return
      }

      event.preventDefault()
      void attach(image)
    }

    document.addEventListener("paste", handlePaste)

    return () => document.removeEventListener("paste", handlePaste)
  }, [attach])

  return { screenshot, isPreparing, attach, remove: () => setScreenshot(null) }
}

interface FeedbackFormProps {
  target?: FeedbackTarget
  onClose: () => void
  onSaved: () => void
}

function FeedbackForm({ target, onClose, onSaved }: FeedbackFormProps) {
  const send = useSendFeedback()
  const [type, setType] = useState(FeedbackType.Broken)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { error, setError, showError } = useErrorState()
  const { screenshot, isPreparing, attach, remove } = useScreenshot(setError, showError)
  const [context] = useState(() => currentContext(target))

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (message.trim().length === 0) {
      setError(NO_MESSAGE)

      return
    }

    setError(null)
    setIsSending(true)

    try {
      await send({
        type,
        message,
        screenshot: screenshot?.blob ?? null,
        context: currentContext(target),
      })
      onSaved()
    } catch (caught) {
      showError(caught)
      setIsSending(false)
    }
  }

  const image = screenshot
    ? {
        src: screenshot.url,
        alt: "Screenshot",
        meta: `${screenshot.size.width} × ${screenshot.size.height} px · ${formatBytes(screenshot.blob.size)}`,
      }
    : null

  return (
    <Dialog
      title={DIALOG_TITLE}
      open
      onClose={onClose}
      onSubmit={(event) => {
        void submit(event)
      }}
      footer={
        <>
          <Button variant={ButtonVariant.Ghost} disabled={isSending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={ButtonVariant.Primary}
            disabled={isSending || isPreparing}
            aria-busy={isSending}
          >
            {isSending ? "Sending…" : "Send feedback"}
          </Button>
        </>
      }
    >
      <Text tone={TextTone.Muted} size={TextSize.Small}>
        Something not working, an idea, or a question? Write it here. A screenshot helps.
      </Text>
      <Field label="Type">
        <SegmentedControl value={type} options={TYPE_OPTIONS} onChange={setType} />
      </Field>
      <Field label="Message">
        <TextArea
          data-autofocus
          rows={MESSAGE_ROWS}
          required
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={PLACEHOLDERS[type]}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </Field>
      <Field label="Screenshot (optional)">
        <ImageInput
          image={image}
          accept={SCREENSHOT_ACCEPT}
          hint={pasteHint()}
          busy={isPreparing}
          onFile={(file) => {
            void attach(file)
          }}
          onRemove={remove}
        />
      </Field>
      {error ? (
        <Text tone={TextTone.Danger} size={TextSize.Small} alert>
          {error}
        </Text>
      ) : null}
      <Text tone={TextTone.Muted} size={TextSize.ExtraSmall}>
        {contextSummary(context)}
      </Text>
    </Dialog>
  )
}

export interface FeedbackDialogProps extends FeedbackFormProps {
  open: boolean
}

// Mounted fresh on every open, so a closed dialog forgets its draft.
export function FeedbackDialog({ open, ...form }: FeedbackDialogProps) {
  return open ? <FeedbackForm {...form} /> : null
}
