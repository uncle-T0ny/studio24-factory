import { Plus, X } from "lucide-react"
import { useState } from "react"
import { Field } from "../Field"
import { IconButton, IconButtonVariant } from "../IconButton"
import { NumberStepper } from "../NumberStepper"
import { SegmentedControl } from "../SegmentedControl"
import { Select } from "../Select"
import { Tab, TabEditor, TabList, Tabs } from "../Tabs"
import { TextField } from "../TextField"
import { ControlSize, type Option } from "../types"
import {
  ICON_SIZE,
  Shape,
  ViewName,
  SHAPE_OPTIONS,
  VIEW_OPTIONS,
  KitSection,
  Specimen,
} from "./kitShared"

enum Size {
  Small = "small",
  Medium = "medium",
  Large = "large",
}

const SIZE_OPTIONS: Option<Size>[] = [
  {
    value: Size.Small,
    label: "Small",
  },
  {
    value: Size.Medium,
    label: "Medium",
  },
  {
    value: Size.Large,
    label: "Large",
  },
]

export function ChoicesSection() {
  const [quantity, setQuantity] = useState(7)
  const [extras, setExtras] = useState(1)
  const [shape, setShape] = useState(Shape.Round)
  const [size, setSize] = useState(Size.Small)
  const [view, setView] = useState(ViewName.Board)

  return (
    <KitSection id="choices">
      <div className="kit-grid">
        <Specimen label="NumberStepper · interactive (0 to 12) · highlighted">
          <Field label="Quantity">
            <NumberStepper value={quantity} min={0} max={12} onChange={setQuantity} />
          </Field>
          <Field label="Extras">
            <NumberStepper
              value={extras}
              min={0}
              max={4}
              highlighted={extras > 0}
              format={(value) => (value > 0 ? `+${value}` : "0")}
              onChange={setExtras}
            />
          </Field>
        </Specimen>
        <Specimen label="NumberStepper · at min · at max · disabled">
          <NumberStepper label="At min" value={0} min={0} max={12} onChange={() => undefined} />
          <NumberStepper label="At max" value={12} min={0} max={12} onChange={() => undefined} />
          <NumberStepper label="Disabled" value={6} disabled onChange={() => undefined} />
        </Specimen>
        <Specimen label="SegmentedControl · interactive (arrow keys) · disabled">
          <Field label="Shape">
            <SegmentedControl value={shape} options={SHAPE_OPTIONS} onChange={setShape} />
          </Field>
          <Field label="Size">
            <SegmentedControl value={size} options={SIZE_OPTIONS} onChange={setSize} />
          </Field>
          <SegmentedControl
            label="Disabled"
            value={Shape.Rect}
            options={SHAPE_OPTIONS}
            disabled
            onChange={() => undefined}
          />
        </Specimen>
        <Specimen label="Select · md · sm · disabled">
          <Field label="Size">
            <Select value={size} options={SIZE_OPTIONS} onChange={setSize} />
          </Field>
          <Select
            label="Small"
            size={ControlSize.Small}
            value={size}
            options={SIZE_OPTIONS}
            onChange={setSize}
          />
          <Select
            label="Disabled"
            value={Size.Large}
            options={SIZE_OPTIONS}
            disabled
            onChange={() => undefined}
          />
        </Specimen>
        <Specimen label="Tabs · interactive">
          <div className="kit-stage kit-stage--bar">
            <Tabs label="Views" value={view} options={VIEW_OPTIONS} onChange={setView} />
          </div>
        </Specimen>
        <Specimen label="TabList · Tab · TabEditor (renaming) · add">
          <div className="kit-stage kit-stage--bar">
            <TabList label="Views being edited">
              <Tab selected={false}>Board</Tab>
              <TabEditor>
                <TextField size={ControlSize.Small} defaultValue="List" aria-label="View name" />
                <IconButton
                  label="Delete view"
                  variant={IconButtonVariant.Danger}
                  icon={<X size={ICON_SIZE} />}
                />
              </TabEditor>
              <IconButton label="Add view" icon={<Plus size={ICON_SIZE} />} />
            </TabList>
          </div>
        </Specimen>
      </div>
    </KitSection>
  )
}
