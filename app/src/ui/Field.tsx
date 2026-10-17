import { createContext, useContext, useId, type ReactNode } from "react"
import { classNames } from "./types"

interface FieldContextValue {
  controlId: string
  labelId: string
  describedById?: string
  isInvalid: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext)
}

export interface FieldProps {
  label: string
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
}

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId()
  const message = error ?? hint
  const messageId = `${id}-message`
  const context: FieldContextValue = {
    controlId: `${id}-control`,
    labelId: `${id}-label`,
    describedById: message ? messageId : undefined,
    isInvalid: Boolean(error),
  }

  return (
    <div className="ui-field">
      <label id={context.labelId} htmlFor={context.controlId} className="ui-field-label">
        {label}
      </label>
      <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      {message ? (
        <p
          id={messageId}
          className={classNames("ui-field-message", error ? "ui-field-message--error" : null)}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
