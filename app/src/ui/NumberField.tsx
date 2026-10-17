import { useState } from "react"
import { clampValue } from "./NumberStepper"
import { TextArea, TextField } from "./TextField"
import type { ControlSize } from "./types"
import { useDraft } from "./useDraft"

export function parseNumberDraft(draft: string): number | null {
  const trimmed = draft.trim()

  if (trimmed.length === 0) {
    return null
  }

  const parsed = Number(trimmed)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

export enum DraftStatus {
  Valid = "valid",
  NotANumber = "notANumber",
  OutOfRange = "outOfRange",
}

export interface DraftCheck {
  status: DraftStatus
  value: number | null
  message: string | null
}

function rangeMessage(min: number, max: number): string {
  if (Number.isFinite(min) && Number.isFinite(max)) {
    return `Enter ${min} to ${max}`
  }

  if (Number.isFinite(min)) {
    return `Enter ${min} or more`
  }

  return `Enter ${max} or less`
}

export function checkNumberDraft(draft: string, min = -Infinity, max = Infinity): DraftCheck {
  const parsed = parseNumberDraft(draft)

  if (parsed === null) {
    return {
      status: DraftStatus.NotANumber,
      value: null,
      message: "Enter a number",
    }
  }

  const isInRange = parsed >= min && parsed <= max

  if (!isInRange) {
    return {
      status: DraftStatus.OutOfRange,
      value: parsed,
      message: rangeMessage(min, max),
    }
  }

  return {
    status: DraftStatus.Valid,
    value: parsed,
    message: null,
  }
}

export interface NumberFieldProps {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
  size?: ControlSize
  disabled?: boolean
}

export function NumberField({
  value,
  onChange,
  step = 1,
  min,
  max,
  suffix,
  size,
  disabled,
}: NumberFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft, resetDraft] = useDraft(String(value), isEditing)
  const lowest = min ?? -Infinity
  const highest = max ?? Infinity
  const check = checkNumberDraft(draft, lowest, highest)
  const message = isEditing ? check.message : null

  const change = (nextDraft: string) => {
    const nextCheck = checkNumberDraft(nextDraft, lowest, highest)

    setDraft(nextDraft)

    const isNewValue = nextCheck.status === DraftStatus.Valid && nextCheck.value !== value

    if (isNewValue && nextCheck.value !== null) {
      onChange(nextCheck.value)
    }
  }

  const settle = () => {
    if (check.value === null) {
      resetDraft()

      return
    }

    const next = clampValue(check.value, lowest, highest)

    setDraft(String(next))

    if (next !== value) {
      onChange(next)
    }
  }

  return (
    <>
      <TextField
        type="number"
        mono
        size={size}
        suffix={suffix}
        value={draft}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        invalid={message !== null ? true : undefined}
        onFocus={() => setIsEditing(true)}
        onChange={(event) => change(event.target.value)}
        onBlur={() => {
          setIsEditing(false)
          settle()
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            settle()
          }
        }}
      />
      {message ? (
        <span className="ui-field-message ui-field-message--error" role="alert">
          {message}
        </span>
      ) : null}
    </>
  )
}

export interface DraftTextFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  size?: ControlSize
  disabled?: boolean
}

export function DraftTextField({
  value,
  onChange,
  placeholder,
  multiline = false,
  size,
  disabled,
}: DraftTextFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft, resetDraft] = useDraft(value, isEditing)

  const change = (nextDraft: string) => {
    setDraft(nextDraft)

    if (nextDraft !== value) {
      onChange(nextDraft)
    }
  }

  const settle = () => {
    setIsEditing(false)
    resetDraft()
  }

  if (multiline) {
    return (
      <TextArea
        value={draft}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setIsEditing(true)}
        onChange={(event) => change(event.target.value)}
        onBlur={settle}
      />
    )
  }

  return (
    <TextField
      value={draft}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      onFocus={() => setIsEditing(true)}
      onChange={(event) => change(event.target.value)}
      onBlur={settle}
    />
  )
}
