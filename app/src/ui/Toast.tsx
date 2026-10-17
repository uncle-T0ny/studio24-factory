import type { ReactNode } from "react"
import { classNames, Tone } from "./types"

export interface ToastProps {
  tone?: Tone
  // Pinned to the bottom of the window instead of its positioned parent (e.g. the editor).
  fixed?: boolean
  children: ReactNode
}

export function Toast({ tone = Tone.Neutral, fixed = false, children }: ToastProps) {
  const role = tone === Tone.Danger ? "alert" : "status"
  const className = classNames("ui-toast", `ui-toast--${tone}`, fixed ? "ui-toast--fixed" : null)

  return (
    <div className={className} role={role}>
      {children}
    </div>
  )
}
