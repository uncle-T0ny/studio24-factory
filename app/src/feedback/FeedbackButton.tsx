import { MessageSquareText } from "lucide-react"
import { useState } from "react"
import { useTimedState } from "../lib/useTimedState"
import { Button, ButtonVariant, Toast, Tone } from "../ui"
import { FeedbackDialog } from "./FeedbackDialog"
import type { FeedbackTarget } from "./context"

const ICON_SIZE = 14
const SAVED_VISIBLE_MS = 4000

export interface FeedbackButtonProps {
  // The project the page shows; none on the projects and feedback pages.
  target?: FeedbackTarget
}

// "Feedback" for signed-in owners: the projects page and a project's page, never a guest.
export function FeedbackButton({ target }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaved, setIsSaved] = useTimedState(false, SAVED_VISIBLE_MS)

  return (
    <>
      <Button
        variant={ButtonVariant.Ghost}
        icon={<MessageSquareText size={ICON_SIZE} />}
        title="Something broken, an idea or a question? Tell us."
        aria-haspopup="dialog"
        onClick={() => {
          setIsSaved(false)
          setIsOpen(true)
        }}
      >
        Feedback
      </Button>
      <FeedbackDialog
        open={isOpen}
        target={target}
        onClose={() => setIsOpen(false)}
        onSaved={() => {
          setIsOpen(false)
          setIsSaved(true)
        }}
      />
      {isSaved ? (
        <Toast tone={Tone.Accent} fixed>
          Thanks! Saved.
        </Toast>
      ) : null}
    </>
  )
}
