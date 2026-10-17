import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Link } from "react-router-dom"
import { classNames } from "./types"

export interface ListProps {
  label?: string
  children: ReactNode
}

export function List({ label, children }: ListProps) {
  return (
    <ul className="ui-list" aria-label={label}>
      {children}
    </ul>
  )
}

export interface ListRowProps {
  title: ReactNode
  meta?: ReactNode
  to?: string
  actions?: ReactNode
}

export function ListRow({ title, meta, to, actions }: ListRowProps) {
  const body = (
    <>
      <span className="ui-list-row-title">{title}</span>
      {meta ? <span className="ui-list-row-meta">{meta}</span> : null}
    </>
  )

  return (
    <li className="ui-list-row">
      {to ? (
        <Link className="ui-list-row-link" to={to}>
          {body}
        </Link>
      ) : (
        <span className="ui-list-row-body">{body}</span>
      )}
      {actions}
    </li>
  )
}

export enum ListButtonTone {
  Default = "default",
  Accent = "accent",
}

export interface ListButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  icon?: ReactNode
  meta?: ReactNode
  tone?: ListButtonTone
}

export function ListButton({
  icon,
  meta,
  tone = ListButtonTone.Default,
  type = "button",
  children,
  ...rest
}: ListButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={classNames("ui-list-button", `ui-list-button--${tone}`)}
    >
      {icon ? (
        <span className="ui-list-button-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
      {meta ? <span className="ui-list-button-meta">{meta}</span> : null}
    </button>
  )
}
