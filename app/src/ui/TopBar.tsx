import type { ReactNode } from "react"
import { classNames } from "./types"

export interface TopBarProps {
  children: ReactNode
}

export function TopBar({ children }: TopBarProps) {
  return <header className="ui-top-bar">{children}</header>
}

export enum TopBarAlign {
  Start = "start",
  End = "end",
}

export interface TopBarGroupProps {
  align: TopBarAlign
  children: ReactNode
}

export function TopBarGroup({ align, children }: TopBarGroupProps) {
  return (
    <div className={classNames("ui-top-bar-group", `ui-top-bar-group--${align}`)}>{children}</div>
  )
}

export interface TopBarTitleProps {
  children: ReactNode
  title?: string
  onClick?: () => void
}

export function TopBarTitle({ children, title, onClick }: TopBarTitleProps) {
  return (
    <button type="button" className="ui-top-bar-title" title={title} onClick={onClick}>
      {children}
    </button>
  )
}

export interface ToolbarProps {
  children: ReactNode
  wrap?: boolean
}

export function Toolbar({ children, wrap = false }: ToolbarProps) {
  return (
    <div className={classNames("ui-toolbar", wrap ? "ui-toolbar--wrap" : null)}>{children}</div>
  )
}
