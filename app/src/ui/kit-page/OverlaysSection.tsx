import { Copy, Link2, MessageSquareText, Share2 } from "lucide-react"
import { useState } from "react"
import { useTimedState } from "../../lib/useTimedState"
import { Button, ButtonVariant } from "../Button"
import { Dialog, DialogSize, DialogSurface } from "../Dialog"
import { Field } from "../Field"
import { NumberStepper } from "../NumberStepper"
import { Popover, PopoverAlign, PopoverSize, PopoverSurface } from "../Popover"
import { ShortcutList } from "../ShortcutList"
import { Text, TextSize, TextTone } from "../Text"
import { TextArea, TextField } from "../TextField"
import { Toast } from "../Toast"
import { Toolbar } from "../TopBar"
import { ControlSize, Tone } from "../types"
import { ICON_SIZE, KitSection, Specimen, Row, BADGE_TONES } from "./kitShared"

const KIT_TOAST_MS = 3000

const KIT_SHORTCUTS = [
  {
    keys: ["⌘", "Z"],
    label: "Undo",
  },
  {
    keys: ["⌘", "⇧", "Z"],
    label: "Redo",
  },
  {
    keys: ["⇧", "Arrows"],
    label: "Move 10 px",
  },
]

function DialogSpecimen() {
  const [isOpen, setIsOpen] = useState(false)
  const [isToastShown, setIsToastShown] = useTimedState(false, KIT_TOAST_MS)

  return (
    <Specimen label="Dialog · interactive (modal; Escape or Close; data-autofocus gets the focus) · Toast fixed">
      <Row>
        <Button
          variant={ButtonVariant.Ghost}
          icon={<MessageSquareText size={ICON_SIZE} />}
          onClick={() => setIsOpen(true)}
        >
          Feedback
        </Button>
        <Button size={ControlSize.Small} onClick={() => setIsToastShown(true)}>
          Show fixed toast
        </Button>
      </Row>
      <Dialog
        title="Send feedback"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(event) => {
          event.preventDefault()
          setIsOpen(false)
          setIsToastShown(true)
        }}
        footer={
          <>
            <Button variant={ButtonVariant.Ghost} onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={ButtonVariant.Primary}>
              Send feedback
            </Button>
          </>
        }
      >
        <Field label="Message">
          <TextArea data-autofocus rows={4} placeholder="What happened?" />
        </Field>
        <Text tone={TextTone.Muted} size={TextSize.ExtraSmall}>
          Sent with: /ui-kit · Chrome 141 on macOS · version a680093
        </Text>
      </Dialog>
      {isToastShown ? (
        <Toast tone={Tone.Accent} fixed>
          Thanks! Saved.
        </Toast>
      ) : null}
    </Specimen>
  )
}

export function OverlaysSection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <KitSection id="overlays">
      <div className="kit-grid kit-grid--wide">
        <Specimen label="Popover · interactive (Escape or click outside closes) · size Wide">
          <div className="kit-popover-room">
            <Popover
              label="Share link"
              open={isOpen}
              onOpenChange={setIsOpen}
              size={PopoverSize.Wide}
              trigger={
                <Button icon={<Share2 size={ICON_SIZE} />} onClick={() => setIsOpen(!isOpen)}>
                  Share link
                </Button>
              }
            >
              <Field label="Link to share">
                <TextField readOnly mono size={ControlSize.Small} value="https://…/p/4f9c2a" />
              </Field>
              <Toolbar>
                <Button
                  size={ControlSize.Small}
                  variant={ButtonVariant.Primary}
                  icon={<Copy size={ICON_SIZE} />}
                >
                  Copy link
                </Button>
                <Button
                  size={ControlSize.Small}
                  variant={ButtonVariant.Ghost}
                  icon={<Link2 size={ICON_SIZE} />}
                >
                  New link
                </Button>
              </Toolbar>
            </Popover>
          </div>
        </Specimen>
        <Specimen label="PopoverSurface · open, placed by the caller (e.g. on the canvas)">
          <PopoverSurface label="Row 1 · left">
            <Text size={TextSize.Small}>
              <strong>Row 1 · left</strong>
            </Text>
            <Field label="Items per page">
              <NumberStepper value={6} onChange={() => undefined} />
            </Field>
            <Button variant={ButtonVariant.Link} size={ControlSize.Small}>
              Duplicate row
            </Button>
          </PopoverSurface>
          <Text size={TextSize.ExtraSmall} tone={TextTone.Muted}>
            Popover align: {PopoverAlign.Start} (default) or {PopoverAlign.End}.
          </Text>
        </Specimen>
        <Specimen label="ShortcutList and Kbd · the keyboard shortcuts popover">
          <PopoverSurface label="Keyboard shortcuts">
            <Text size={TextSize.Small}>
              <strong>Keyboard shortcuts</strong>
            </Text>
            <ShortcutList shortcuts={KIT_SHORTCUTS} />
          </PopoverSurface>
        </Specimen>
        <DialogSpecimen />
        <Specimen label="DialogSurface · the dialog's look in place · footer · wide size for images">
          <DialogSurface
            title="Send feedback"
            footer={
              <>
                <Button variant={ButtonVariant.Ghost}>Cancel</Button>
                <Button variant={ButtonVariant.Primary}>Send feedback</Button>
              </>
            }
          >
            <Field label="Message">
              <TextArea defaultValue="The export button does nothing on this project." />
            </Field>
          </DialogSurface>
          <Text size={TextSize.ExtraSmall} tone={TextTone.Muted}>
            DialogSize: {DialogSize.Medium} (default) or {DialogSize.Wide} (an enlarged thumbnail).
          </Text>
        </Specimen>
        <Specimen label="Toast · neutral, accent, warning, danger">
          {BADGE_TONES.map((tone) => (
            <div key={tone} className="kit-stage kit-stage--toast">
              <Toast tone={tone}>
                {tone === Tone.Danger ? "Couldn't save the change." : `${tone} toast`}
              </Toast>
            </div>
          ))}
        </Specimen>
      </div>
    </KitSection>
  )
}
