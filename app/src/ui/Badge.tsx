import type { ReactNode } from "react"
import { classNames, Tone } from "./types"

export interface BadgeProps {
  tone?: Tone
  children: ReactNode
}

export function Badge({ tone = Tone.Neutral, children }: BadgeProps) {
  return <span className={classNames("ui-badge", `ui-badge--${tone}`)}>{children}</span>
}

export interface ChipProps {
  tone?: Tone
  children: ReactNode
  // Makes the label a button, e.g. the trigger of a Popover: `expanded` says whether it is open.
  onClick?: () => void
  expanded?: boolean
  title?: string
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
  actionTitle?: string
}

export function Chip({
  tone = Tone.Neutral,
  children,
  onClick,
  expanded,
  title,
  actionLabel,
  onAction,
  actionDisabled = false,
  actionTitle,
}: ChipProps) {
  const hasAction = Boolean(actionLabel) && Boolean(onAction)

  return (
    <span className={classNames("ui-chip", `ui-chip--${tone}`)}>
      {onClick ? (
        <button
          type="button"
          className="ui-chip-label"
          aria-expanded={expanded}
          aria-haspopup={expanded === undefined ? undefined : "dialog"}
          title={title}
          onClick={onClick}
        >
          {children}
        </button>
      ) : (
        <span title={title}>{children}</span>
      )}
      {hasAction ? (
        <button
          type="button"
          className="ui-chip-action"
          disabled={actionDisabled}
          title={actionTitle}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </span>
  )
}

export interface CalloutProps {
  tone?: Tone
  title?: ReactNode
  children?: ReactNode
}

export function Callout({ tone = Tone.Neutral, title, children }: CalloutProps) {
  return (
    <div className={classNames("ui-callout", `ui-callout--${tone}`)}>
      {title ? <p className="ui-callout-title">{title}</p> : null}
      {children}
    </div>
  )
}
