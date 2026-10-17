import { useEffect, useRef, type ReactNode } from "react"
import { classNames } from "./types"

export enum PopoverAlign {
  Start = "start",
  End = "end",
}

export enum PopoverSize {
  // As wide as its content needs.
  Auto = "auto",
  // A panel of fixed width, e.g. share or a list of changes; scrolls when taller than the window.
  Wide = "wide",
}

export interface PopoverSurfaceProps {
  label: string
  size?: PopoverSize
  children: ReactNode
}

export function PopoverSurface({ label, size = PopoverSize.Auto, children }: PopoverSurfaceProps) {
  return (
    <div
      className={classNames("ui-popover-surface", `ui-popover-surface--${size}`)}
      role="dialog"
      aria-label={label}
    >
      {children}
    </div>
  )
}

export interface PopoverProps {
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  align?: PopoverAlign
  size?: PopoverSize
  children: ReactNode
}

// The trigger opens and closes it; Escape or a pointer down outside closes it.
export function Popover({
  label,
  open,
  onOpenChange,
  trigger,
  align = PopoverAlign.Start,
  size,
  children,
}: PopoverProps) {
  const rootRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current
      const isInside = root !== null && event.target instanceof Node && root.contains(event.target)

      if (!isInside) {
        onOpenChange(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onOpenChange])

  return (
    <span ref={rootRef} className={classNames("ui-popover", `ui-popover--${align}`)}>
      {trigger}
      {open ? (
        <PopoverSurface label={label} size={size}>
          {children}
        </PopoverSurface>
      ) : null}
    </span>
  )
}
