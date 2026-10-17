import type { ReactNode } from "react"
import { classNames } from "./types"

export enum PanelSide {
  Left = "left",
  Right = "right",
}

export interface PanelProps {
  side: PanelSide
  label?: string
  children: ReactNode
}

export function Panel({ side, label, children }: PanelProps) {
  return (
    <aside className={classNames("ui-panel", `ui-panel--${side}`)} aria-label={label}>
      {children}
    </aside>
  )
}

export interface SectionProps {
  label?: string
  title?: ReactNode
  divided?: boolean
  compact?: boolean
  children?: ReactNode
}

export function Section({
  label,
  title,
  divided = false,
  compact = false,
  children,
}: SectionProps) {
  const className = classNames(
    "ui-section",
    divided ? "ui-section--divided" : null,
    compact ? "ui-section--compact" : null,
  )
  const hasHead = Boolean(label) || Boolean(title)

  return (
    <section className={className}>
      {hasHead ? (
        <div className="ui-section-head">
          {label ? <h3 className="ui-section-label">{label}</h3> : null}
          {title ? <p className="ui-section-title">{title}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export interface ButtonRowProps {
  children: ReactNode
}

export function ButtonRow({ children }: ButtonRowProps) {
  return <div className="ui-button-row">{children}</div>
}
