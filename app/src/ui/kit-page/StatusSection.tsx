import { useState } from "react"
import { Badge, Callout, Chip } from "../Badge"
import { Button, ButtonVariant } from "../Button"
import { ControlSize, Tone } from "../types"
import { KitSection, Specimen, Row, BADGE_TONES } from "./kitShared"

export function StatusSection() {
  const [isSeen, setIsSeen] = useState(false)

  return (
    <KitSection id="status">
      <div className="kit-grid">
        <Specimen label="Badge · neutral, accent, warning, danger">
          <Row>
            {BADGE_TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </Row>
        </Specimen>
        <Specimen label="Chip · warning with action (ChangesBar) · accent · neutral">
          <Row>
            {isSeen ? (
              <Chip>All changes seen</Chip>
            ) : (
              <Chip tone={Tone.Warning} actionLabel="Mark as seen" onAction={() => setIsSeen(true)}>
                Changes: 1
              </Chip>
            )}
            <Chip
              onClick={() => undefined}
              expanded={false}
              actionLabel="Mark as seen"
              onAction={() => undefined}
              actionDisabled
            >
              Label as a popover trigger · action disabled
            </Chip>
            {isSeen ? (
              <Button
                size={ControlSize.Small}
                variant={ButtonVariant.Link}
                onClick={() => setIsSeen(false)}
              >
                Reset
              </Button>
            ) : null}
          </Row>
          <Row>
            <Chip tone={Tone.Accent}>Link copied</Chip>
            <Chip>Draft</Chip>
          </Row>
        </Specimen>
        <Specimen label="Callout · neutral, accent, warning, danger">
          {BADGE_TONES.map((tone) => (
            <Callout key={tone} tone={tone} title={`${tone} title`}>
              Supporting text.
            </Callout>
          ))}
        </Specimen>
      </div>
    </KitSection>
  )
}
