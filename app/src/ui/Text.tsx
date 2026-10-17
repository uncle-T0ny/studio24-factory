import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { classNames } from "./types"

export enum TextSize {
  ExtraSmall = "xs",
  Small = "sm",
  Medium = "md",
}

export enum TextTone {
  Default = "default",
  Muted = "muted",
  Accent = "accent",
  Warning = "warning",
  Danger = "danger",
}

export interface TextProps {
  children: ReactNode
  tone?: TextTone
  size?: TextSize
  mono?: boolean
  inline?: boolean
  alert?: boolean
  // Keeps the text's own line breaks and wraps long words, e.g. a message someone typed.
  multiline?: boolean
}

export function Text({
  children,
  tone = TextTone.Default,
  size = TextSize.Medium,
  mono = false,
  inline = false,
  alert = false,
  multiline = false,
}: TextProps) {
  const className = classNames(
    "ui-text",
    `ui-text--${tone}`,
    `ui-text--${size}`,
    mono ? "ui-text--mono" : null,
    multiline ? "ui-text--multiline" : null,
  )
  const role = alert ? "alert" : undefined

  if (inline) {
    return (
      <span className={className} role={role}>
        {children}
      </span>
    )
  }

  return (
    <p className={className} role={role}>
      {children}
    </p>
  )
}

export interface EyebrowProps {
  children: ReactNode
}

export function Eyebrow({ children }: EyebrowProps) {
  return <p className="ui-eyebrow">{children}</p>
}

export enum HeadingLevel {
  Display = "display",
  Title = "title",
  Section = "section",
}

const HEADING_TAGS = {
  [HeadingLevel.Display]: "h1",
  [HeadingLevel.Title]: "h2",
  [HeadingLevel.Section]: "h2",
} as const

export interface HeadingProps {
  level: HeadingLevel
  children: ReactNode
}

export function Heading({ level, children }: HeadingProps) {
  const Tag = HEADING_TAGS[level]

  return <Tag className={classNames("ui-heading", `ui-heading--${level}`)}>{children}</Tag>
}

export interface TextLinkProps {
  to: string
  children: ReactNode
}

export function TextLink({ to, children }: TextLinkProps) {
  return (
    <Link className="ui-text-link" to={to}>
      {children}
    </Link>
  )
}
