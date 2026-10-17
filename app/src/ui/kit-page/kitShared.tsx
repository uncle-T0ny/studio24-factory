import type { ReactNode } from "react"
import { Tone, type Option } from "../types"

export const ICON_SIZE = 14
export const PAGE_PATH = "/ui-kit"
export const KIT_IMAGE_ALT = "Screenshot"
// A public asset (the placeholder app icon), so the kit page imports no feature code.
export const KIT_IMAGE_SRC = "/apple-touch-icon.png"

export enum Shape {
  Round = "round",
  Rect = "rect",
}

export enum ViewName {
  Board = "board",
  List = "list",
}

export const SHAPE_OPTIONS: Option<Shape>[] = [
  {
    value: Shape.Round,
    label: "Round",
  },
  {
    value: Shape.Rect,
    label: "Rectangular",
  },
]

export const VIEW_OPTIONS: Option<ViewName>[] = [
  {
    value: ViewName.Board,
    label: "Board",
  },
  {
    value: ViewName.List,
    label: "List",
  },
]

export const SECTIONS: Record<string, string> = {
  tokens: "Tokens",
  buttons: "Buttons",
  inputs: "Inputs and fields",
  choices: "Stepper, select, segments, tabs",
  status: "Badges, chips, callouts",
  overlays: "Popover, dialog, toast, shortcuts",
  chrome: "Top bar, toolbar, panels",
  lists: "Lists, thumbnails, details",
  pages: "Text and page layout",
}

export interface KitSectionProps {
  id: string
  children: ReactNode
}

export function KitSection({ id, children }: KitSectionProps) {
  const title = SECTIONS[id] ?? id

  return (
    <section id={id} className="kit-section">
      <h2 className="kit-section-title">{title}</h2>
      {children}
    </section>
  )
}

export interface SpecimenProps {
  label: string
  children: ReactNode
}

export function Specimen({ label, children }: SpecimenProps) {
  return (
    <div className="kit-specimen">
      <p className="kit-specimen-label">{label}</p>
      {children}
    </div>
  )
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="kit-row">{children}</div>
}

export const BADGE_TONES: Tone[] = [Tone.Neutral, Tone.Accent, Tone.Warning, Tone.Danger]
