import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react"
import { useFieldContext } from "./Field"
import { classNames, ControlSize } from "./types"

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "size"
> {
  size?: ControlSize
  suffix?: string
  mono?: boolean
  invalid?: boolean
}

export function TextField({
  size = ControlSize.Medium,
  suffix,
  mono = false,
  invalid,
  id,
  type = "text",
  ...rest
}: TextFieldProps) {
  const field = useFieldContext()
  const isInvalid = invalid ?? field?.isInvalid ?? false
  const className = classNames("ui-input", `ui-input--${size}`, mono ? "ui-input--mono" : null)
  const input = (
    <input
      {...rest}
      id={id ?? field?.controlId}
      type={type}
      aria-invalid={isInvalid ? true : undefined}
      aria-describedby={field?.describedById}
      className={className}
    />
  )

  if (!suffix) {
    return input
  }

  return (
    <span className="ui-input-wrap">
      {input}
      <span className="ui-input-suffix">{suffix}</span>
    </span>
  )
}

export interface TextAreaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
> {
  invalid?: boolean
}

export function TextArea({ invalid, id, rows = 3, ...rest }: TextAreaProps) {
  const field = useFieldContext()
  const isInvalid = invalid ?? field?.isInvalid ?? false

  return (
    <textarea
      {...rest}
      id={id ?? field?.controlId}
      rows={rows}
      aria-invalid={isInvalid ? true : undefined}
      aria-describedby={field?.describedById}
      className="ui-input ui-input--multiline"
    />
  )
}

export interface ReadOnlyValueProps {
  children: ReactNode
}

export function ReadOnlyValue({ children }: ReadOnlyValueProps) {
  const field = useFieldContext()

  return (
    <span
      id={field?.controlId}
      aria-labelledby={field?.labelId}
      className="ui-input ui-input--read-only"
    >
      {children}
    </span>
  )
}
