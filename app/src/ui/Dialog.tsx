import { X } from "lucide-react"
import { useEffect, useId, useRef, type ReactNode, type SubmitEvent } from "react"
import { IconButton } from "./IconButton"
import { classNames, ControlSize } from "./types"

const CLOSE_ICON_SIZE = 16

export enum DialogSize {
  Medium = "md",
  Wide = "wide",
}

export interface DialogProps {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: DialogSize
  // A click on the dimmed backdrop closes it: for viewers, never for forms with typed text.
  closeOnBackdrop?: boolean
  // With onSubmit, the body and the footer are one form, so a submit button can sit in the footer.
  onSubmit?: (event: SubmitEvent<HTMLFormElement>) => void
}

interface DialogContentProps {
  titleId: string
  title: string
  onClose?: () => void
  children: ReactNode
  footer?: ReactNode
  onSubmit?: (event: SubmitEvent<HTMLFormElement>) => void
}

function DialogContent({
  titleId,
  title,
  onClose,
  children,
  footer,
  onSubmit,
}: DialogContentProps) {
  const body = (
    <>
      <header className="ui-dialog-header">
        <h2 id={titleId} className="ui-dialog-title">
          {title}
        </h2>
        {onClose ? (
          <IconButton
            label="Close"
            size={ControlSize.Medium}
            icon={<X size={CLOSE_ICON_SIZE} aria-hidden="true" />}
            onClick={onClose}
          />
        ) : null}
      </header>
      <div className="ui-dialog-body">{children}</div>
      {footer ? <footer className="ui-dialog-footer">{footer}</footer> : null}
    </>
  )

  if (onSubmit) {
    return (
      <form className="ui-dialog-content" aria-labelledby={titleId} onSubmit={onSubmit}>
        {body}
      </form>
    )
  }

  return <div className="ui-dialog-content">{body}</div>
}

function OpenDialog({
  title,
  onClose,
  children,
  footer,
  size = DialogSize.Medium,
  closeOnBackdrop = false,
  onSubmit,
}: Omit<DialogProps, "open">) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus()
    }

    return () => {
      if (dialog?.open) {
        dialog.close()
      }
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={classNames("ui-dialog", `ui-dialog--${size}`)}
      aria-labelledby={titleId}
      tabIndex={-1}
      onCancel={(event) => {
        // React passes a nested dialog's cancel (e.g. an enlarged thumbnail) up to this one too.
        if (event.target !== event.currentTarget) {
          return
        }

        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        const isBackdrop = event.target === event.currentTarget

        if (closeOnBackdrop && isBackdrop) {
          onClose()
        }
      }}
    >
      <DialogContent
        titleId={titleId}
        title={title}
        onClose={onClose}
        footer={footer}
        onSubmit={onSubmit}
      >
        {children}
      </DialogContent>
    </dialog>
  )
}

// A modal dialog on the native <dialog>: it traps focus, Escape closes it, the page behind is inert.
// It focuses the element marked `data-autofocus` when it opens, else its first focusable one.
export function Dialog({ open, ...rest }: DialogProps) {
  if (!open) {
    return null
  }

  return <OpenDialog {...rest} />
}

export interface DialogSurfaceProps {
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: DialogSize
}

// The dialog's look, drawn in place with no modal behaviour: for /ui-kit.
export function DialogSurface({
  title,
  children,
  footer,
  size = DialogSize.Medium,
}: DialogSurfaceProps) {
  const titleId = useId()

  return (
    <div
      className={classNames("ui-dialog", "ui-dialog--static", `ui-dialog--${size}`)}
      role="dialog"
      aria-labelledby={titleId}
    >
      <DialogContent titleId={titleId} title={title} footer={footer}>
        {children}
      </DialogContent>
    </div>
  )
}
