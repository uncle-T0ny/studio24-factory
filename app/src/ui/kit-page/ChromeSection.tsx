import {
  ArrowLeft,
  Circle,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  RectangleHorizontal,
  Ruler,
} from "lucide-react"
import { useState } from "react"
import { Callout, Chip } from "../Badge"
import { Button, ButtonVariant } from "../Button"
import { EmptyState } from "../EmptyState"
import { Field } from "../Field"
import { FloatingPlacement, FloatingToolbar } from "../FloatingToolbar"
import { IconButton, IconLink } from "../IconButton"
import { ListButton, ListButtonTone } from "../List"
import { NumberStepper } from "../NumberStepper"
import { ButtonRow, Panel, PanelSide, Section } from "../Panel"
import { SearchField } from "../SearchField"
import { SegmentedControl } from "../SegmentedControl"
import { Tabs } from "../Tabs"
import { TextField } from "../TextField"
import { TopBar, TopBarAlign, TopBarGroup, TopBarTitle, Toolbar } from "../TopBar"
import { ControlSize, Tone } from "../types"
import {
  ICON_SIZE,
  PAGE_PATH,
  Shape,
  ViewName,
  SHAPE_OPTIONS,
  VIEW_OPTIONS,
  KitSection,
  Specimen,
} from "./kitShared"

function FloatingToolbarSpecimen() {
  const [isMeasuring, setIsMeasuring] = useState(false)

  return (
    <div className="kit-stage kit-stage--tall">
      <FloatingToolbar label="Tools" placement={FloatingPlacement.TopStart}>
        <IconButton
          label="Select"
          size={ControlSize.Medium}
          pressed={!isMeasuring}
          icon={<MousePointer2 size={16} />}
          onClick={() => setIsMeasuring(false)}
        />
        <IconButton
          label="Measure (M)"
          size={ControlSize.Medium}
          pressed={isMeasuring}
          icon={<Ruler size={16} />}
          onClick={() => setIsMeasuring(true)}
        />
      </FloatingToolbar>
      <FloatingToolbar label="View" placement={FloatingPlacement.BottomEnd}>
        <IconButton label="Zoom out" size={ControlSize.Medium} icon={<Minus size={16} />} />
        <IconButton label="Zoom in" size={ControlSize.Medium} icon={<Plus size={16} />} />
        <Button
          size={ControlSize.Small}
          variant={ButtonVariant.Ghost}
          icon={<Maximize size={ICON_SIZE} />}
        >
          Fit
        </Button>
      </FloatingToolbar>
    </div>
  )
}

export function ChromeSection() {
  const [view, setView] = useState(ViewName.Board)
  const [shape, setShape] = useState(Shape.Round)
  const [quantity, setQuantity] = useState(7)
  const [sidebarQuery, setSidebarQuery] = useState("")

  return (
    <KitSection id="chrome">
      <Specimen label="TopBar · TopBarGroup start/end · TopBarTitle · TabList · Chip · Buttons">
        <div className="kit-top-bar-frame">
          <TopBar>
            <TopBarGroup align={TopBarAlign.Start}>
              <IconLink
                to={PAGE_PATH}
                label="All projects"
                size={ControlSize.Medium}
                icon={<ArrowLeft size={18} />}
              />
              <TopBarTitle title="Edit names and date">Emma &amp; Liam · Jun 12, 2027</TopBarTitle>
            </TopBarGroup>
            <Tabs label="Views" value={view} options={VIEW_OPTIONS} onChange={setView} />
            <TopBarGroup align={TopBarAlign.End}>
              <Chip tone={Tone.Warning} actionLabel="Mark as seen" onAction={() => undefined}>
                Changes: 1
              </Chip>
              <Button>Share link</Button>
              <Button variant={ButtonVariant.Primary}>Export</Button>
            </TopBarGroup>
          </TopBar>
        </div>
      </Specimen>
      <Specimen label="FloatingToolbar · over the canvas: tools top-start (IconButton pressed), view bottom-end">
        <FloatingToolbarSpecimen />
      </Specimen>
      <Specimen label="Toolbar (the title editor)">
        <Toolbar wrap>
          <TextField
            size={ControlSize.Small}
            defaultValue="Spring launch"
            aria-label="Project name"
          />
          <TextField
            size={ControlSize.Small}
            type="date"
            defaultValue="2027-06-12"
            aria-label="Due date"
          />
          <Button size={ControlSize.Small} variant={ButtonVariant.Primary}>
            Save
          </Button>
          <Button size={ControlSize.Small}>Cancel</Button>
        </Toolbar>
      </Specimen>
      <Specimen label="Panel left (sidebar: SearchField, Section compact + ListButton) · Panel right (properties: Section, Field, divided Section, ButtonRow)">
        <div className="kit-editor-frame">
          <Panel side={PanelSide.Left} label="Sidebar">
            <SearchField
              value={sidebarQuery}
              placeholder="Search projects"
              aria-label="Search the sidebar"
              onChange={setSidebarQuery}
            />
            <Section label="Templates" compact>
              <ListButton icon={<Circle size={16} />} draggable>
                Blank project
              </ListButton>
              <ListButton icon={<RectangleHorizontal size={16} />} draggable>
                From a template
              </ListButton>
              <ListButton tone={ListButtonTone.Accent} icon={<Plus size={16} />}>
                Custom
              </ListButton>
            </Section>
            <Section label="Saved" compact>
              <ListButton meta="4 fields">Sign-up form</ListButton>
              <EmptyState>No templates yet</EmptyState>
            </Section>
          </Panel>
          <div />
          <Panel side={PanelSide.Right} label="Properties">
            <Section label="Selected" title="Spring launch">
              <Field label="Shape">
                <SegmentedControl value={shape} options={SHAPE_OPTIONS} onChange={setShape} />
              </Field>
              <Field label="Quantity">
                <NumberStepper value={quantity} max={12} onChange={setQuantity} />
              </Field>
              <Callout tone={Tone.Warning} title="Changed by a guest">
                Status: Draft → Ready
              </Callout>
            </Section>
            <Section divided>
              <Field label="X">
                <TextField defaultValue="12" suffix="px" mono />
              </Field>
            </Section>
            <ButtonRow>
              <Button>Duplicate</Button>
              <Button variant={ButtonVariant.Danger}>Delete</Button>
            </ButtonRow>
          </Panel>
        </div>
      </Specimen>
    </KitSection>
  )
}
