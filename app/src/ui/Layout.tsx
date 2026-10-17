import type { ReactNode, SubmitEvent } from "react"
import { Eyebrow, Heading, HeadingLevel } from "./Text"
import { classNames } from "./types"

export enum CardElement {
  Div = "div",
  // One entry of a feed, e.g. a feedback entry: an article named by `label`.
  Article = "article",
}

export interface CardProps {
  children: ReactNode
  narrow?: boolean
  label?: string
  element?: CardElement
  onSubmit?: (event: SubmitEvent<HTMLFormElement>) => void
}

export function Card({
  children,
  narrow = false,
  label,
  element = CardElement.Div,
  onSubmit,
}: CardProps) {
  const className = classNames("ui-card", narrow ? "ui-card--narrow" : null)

  if (onSubmit) {
    return (
      <form className={className} aria-label={label} onSubmit={onSubmit}>
        {children}
      </form>
    )
  }

  if (element === CardElement.Article) {
    return (
      <article className={className} aria-label={label}>
        {children}
      </article>
    )
  }

  return (
    <div className={className} aria-label={label}>
      {children}
    </div>
  )
}

export interface CardHeaderProps {
  children: ReactNode
  actions?: ReactNode
}

// A card's first row: what it is on the left, its controls on the right; wraps when narrow.
export function CardHeader({ children, actions }: CardHeaderProps) {
  return (
    <div className="ui-card-header">
      <div className="ui-card-header-main">{children}</div>
      {actions ? <div className="ui-card-header-actions">{actions}</div> : null}
    </div>
  )
}

export interface PageProps {
  children: ReactNode
}

export function CenteredPage({ children }: PageProps) {
  return <main className="ui-centered-page">{children}</main>
}

export function PageColumn({ children }: PageProps) {
  return <main className="ui-page-column">{children}</main>
}

export interface PageHeaderProps {
  eyebrow?: string
  title: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, actions }: PageHeaderProps) {
  return (
    <header className="ui-page-header">
      <div className="ui-page-header-titles">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading level={HeadingLevel.Display}>{title}</Heading>
      </div>
      {actions}
    </header>
  )
}

export interface FormRowProps {
  children: ReactNode
}

export function FormRow({ children }: FormRowProps) {
  return <div className="ui-form-row">{children}</div>
}
