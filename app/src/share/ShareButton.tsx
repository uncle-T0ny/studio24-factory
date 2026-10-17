import { useMutation } from "convex/react"
import { useId, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useErrorState } from "../lib/errors"
import { useTimedState } from "../lib/useTimedState"
import {
  Button,
  ButtonRow,
  ButtonVariant,
  Callout,
  Popover,
  PopoverAlign,
  PopoverSize,
  Section,
  Text,
  TextField,
  TextSize,
  TextTone,
  Toolbar,
  Tone,
} from "../ui"
import { copyText, shareLinkOf } from "./shareLink"
import "./share.css"

const COPIED_VISIBLE_MS = 2000
const POPOVER_LABEL = "Share link"

interface NewLinkConfirmProps {
  isRegenerating: boolean
  onCancel: () => void
  onConfirm: () => void
}

function NewLinkConfirm({ isRegenerating, onCancel, onConfirm }: NewLinkConfirmProps) {
  return (
    <div role="alertdialog" aria-label="Make a new link">
      <Callout tone={Tone.Warning}>
        <Text>Make a new link? The current link stops working right away.</Text>
        <ButtonRow>
          <Button disabled={isRegenerating} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={ButtonVariant.Danger} disabled={isRegenerating} onClick={onConfirm}>
            {isRegenerating ? "Making…" : "Make new link"}
          </Button>
        </ButtonRow>
      </Callout>
    </div>
  )
}

export interface ShareButtonProps {
  projectId: Id<"projects">
  shareToken: string
}

// The owner's share popover: the project's link, Copy, and New link, which revokes the old one.
export function ShareButton({ projectId, shareToken }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const regenerate = useMutation(api.share.regenerate)
  const linkId = useId()
  const [isCopied, setIsCopied] = useTimedState(false, COPIED_VISIBLE_MS)
  const [copyFailed, setCopyFailed] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isRegenerated, setIsRegenerated] = useState(false)
  const { error, setError, showError } = useErrorState()
  const link = shareLinkOf(window.location.origin, shareToken)

  const resetCopy = () => {
    setIsCopied(false)
    setCopyFailed(false)
  }

  const toggle = () => {
    resetCopy()
    setIsConfirming(false)
    setIsRegenerated(false)
    setError(null)
    setIsOpen(!isOpen)
  }

  const copy = async () => {
    try {
      await copyText(link)
      setCopyFailed(false)
      setIsCopied(true)
    } catch {
      // The kit's TextField takes no ref, so the link is found by its id to select it.
      const linkInput = document.getElementById(linkId)

      if (linkInput instanceof HTMLInputElement) {
        linkInput.focus()
        linkInput.select()
      }

      setIsCopied(false)
      setCopyFailed(true)
    }
  }

  const makeNewLink = async () => {
    setIsRegenerating(true)
    setError(null)

    try {
      await regenerate({
        projectId,
      })
      setIsConfirming(false)
      setIsRegenerated(true)
      resetCopy()
    } catch (caught) {
      showError(caught)
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <Popover
      label={POPOVER_LABEL}
      open={isOpen}
      onOpenChange={setIsOpen}
      align={PopoverAlign.End}
      size={PopoverSize.Wide}
      trigger={
        <Button aria-expanded={isOpen} aria-haspopup="dialog" onClick={toggle}>
          {POPOVER_LABEL}
        </Button>
      }
    >
      <Section label={POPOVER_LABEL}>
        <Text tone={TextTone.Muted} size={TextSize.Small}>
          Anyone with this link can open and rename this project, with no sign-up.
        </Text>
        <Toolbar>
          <TextField
            id={linkId}
            mono
            value={link}
            readOnly
            aria-label="Link to share"
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button variant={ButtonVariant.Primary} onClick={() => void copy()}>
            {isCopied ? "Copied" : "Copy"}
          </Button>
        </Toolbar>
        {copyFailed ? (
          <Text tone={TextTone.Muted} size={TextSize.Small}>
            Couldn't copy automatically. The link is selected: press ⌘C or Ctrl+C.
          </Text>
        ) : null}
        {isConfirming ? (
          <NewLinkConfirm
            isRegenerating={isRegenerating}
            onCancel={() => setIsConfirming(false)}
            onConfirm={() => void makeNewLink()}
          />
        ) : (
          <div className="share-footer">
            {isRegenerated ? (
              <Text tone={TextTone.Accent} size={TextSize.Small}>
                New link made. The old one no longer works.
              </Text>
            ) : (
              <span />
            )}
            <Button variant={ButtonVariant.Link} onClick={() => setIsConfirming(true)}>
              New link
            </Button>
          </div>
        )}
        {error ? <Text tone={TextTone.Danger}>{error}</Text> : null}
      </Section>
    </Popover>
  )
}
