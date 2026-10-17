import { ArrowLeft, FileDown, Plus, Ruler, Share2, Undo2, X } from "lucide-react"
import { useState } from "react"
import { Button, ButtonVariant } from "../Button"
import { FileButton } from "../FileButton"
import { IconButton, IconButtonVariant, IconLink } from "../IconButton"
import { ButtonRow } from "../Panel"
import { Text, TextSize, TextTone } from "../Text"
import { ControlSize } from "../types"
import { ICON_SIZE, PAGE_PATH, KitSection, Specimen, Row } from "./kitShared"

const BUTTON_VARIANTS: ButtonVariant[] = [
  ButtonVariant.Primary,
  ButtonVariant.Secondary,
  ButtonVariant.Ghost,
  ButtonVariant.Danger,
  ButtonVariant.Link,
]

const CONTROL_SIZES: ControlSize[] = [ControlSize.Small, ControlSize.Medium, ControlSize.Large]

function FileButtonSpecimen() {
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <Specimen label="FileButton · opens a file picker · disabled">
      <Row>
        <FileButton accept=".json,application/json" onFile={(file) => setFileName(file.name)}>
          Import project
        </FileButton>
        <FileButton accept=".json,application/json" onFile={() => undefined} disabled>
          Importing…
        </FileButton>
      </Row>
      <Text tone={TextTone.Muted} size={TextSize.Small}>
        {fileName ? `Picked: ${fileName}` : "No file picked yet."}
      </Text>
    </Specimen>
  )
}

function ButtonPressedSpecimen() {
  const [isPressed, setIsPressed] = useState(true)

  return (
    <Row>
      <Button pressed={isPressed} onClick={() => setIsPressed(!isPressed)}>
        Edit layout
      </Button>
      <Button pressed={false}>Not pressed</Button>
    </Row>
  )
}

export function ButtonsSection() {
  return (
    <KitSection id="buttons">
      <div className="kit-grid">
        {BUTTON_VARIANTS.map((variant) => (
          <Specimen key={variant} label={`Button · ${variant} · sm, md, lg, disabled`}>
            <Row>
              {CONTROL_SIZES.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {size === ControlSize.Small ? "Small" : "Button"}
                </Button>
              ))}
              <Button variant={variant} disabled>
                Disabled
              </Button>
            </Row>
          </Specimen>
        ))}
        <Specimen label="Button · with icon · stretch">
          <Row>
            <Button variant={ButtonVariant.Primary} icon={<FileDown size={ICON_SIZE} />}>
              Export
            </Button>
            <Button icon={<Share2 size={ICON_SIZE} />}>Share link</Button>
          </Row>
          <Button stretch>Stretch</Button>
        </Specimen>
        <Specimen label="Button · pressed (a toggle: Edit layout) · not pressed">
          <ButtonPressedSpecimen />
        </Specimen>
        <FileButtonSpecimen />
        <Specimen label="IconButton · ghost sm, md · pressed (a tool) · danger · disabled · IconLink">
          <Row>
            <IconButton label="Add view" icon={<Plus size={ICON_SIZE} />} />
            <IconButton
              label="Measure (M)"
              size={ControlSize.Medium}
              pressed
              icon={<Ruler size={16} />}
            />
            <IconButton label="Undo" size={ControlSize.Medium} icon={<Undo2 size={16} />} />
            <IconButton
              label="Delete view"
              variant={IconButtonVariant.Danger}
              icon={<X size={ICON_SIZE} />}
            />
            <IconButton label="Disabled" disabled icon={<Plus size={ICON_SIZE} />} />
            <IconLink
              to={PAGE_PATH}
              label="All projects"
              size={ControlSize.Medium}
              icon={<ArrowLeft size={18} />}
            />
          </Row>
        </Specimen>
        <Specimen label="ButtonRow (panel actions)">
          <ButtonRow>
            <Button>Duplicate</Button>
            <Button variant={ButtonVariant.Danger}>Delete</Button>
          </ButtonRow>
        </Specimen>
      </div>
    </KitSection>
  )
}
