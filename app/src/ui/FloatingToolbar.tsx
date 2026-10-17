import type { ReactNode } from "react"
import { classNames } from "./types"

export enum FloatingPlacement {
  TopStart = "top-start",
  TopEnd = "top-end",
  BottomEnd = "bottom-end",
}

export interface FloatingToolbarProps {
  label: string
  placement: FloatingPlacement
  children: ReactNode
}

export function FloatingToolbar({ label, placement, children }: FloatingToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className={classNames("ui-floating-toolbar", `ui-floating-toolbar--${placement}`)}
    >
      {children}
    </div>
  )
}
