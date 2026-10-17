import { Minus, Plus } from "lucide-react"
import { useFieldContext } from "./Field"
import { classNames } from "./types"

const ICON_SIZE = 14

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function stepValue(value: number, delta: number, min: number, max: number): number {
  return clampValue(value + delta, min, max)
}

export interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  format?: (value: number) => string
  highlighted?: boolean
  disabled?: boolean
  label?: string
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  format,
  highlighted = false,
  disabled = false,
  label,
}: NumberStepperProps) {
  const field = useFieldContext()
  const isAtMin = value <= min
  const isAtMax = value >= max

  const change = (delta: number) => {
    const next = stepValue(value, delta, min, max)

    if (next !== value) {
      onChange(next)
    }
  }

  return (
    <div
      className="ui-stepper"
      role="group"
      id={field?.controlId}
      aria-labelledby={field?.labelId}
      aria-label={field ? undefined : label}
    >
      <button
        type="button"
        className="ui-stepper-button"
        aria-label="Decrease"
        disabled={disabled || isAtMin}
        onClick={() => change(-step)}
      >
        <Minus size={ICON_SIZE} aria-hidden="true" />
      </button>
      <output
        className={classNames(
          "ui-stepper-value",
          highlighted ? "ui-stepper-value--highlighted" : null,
        )}
        aria-live="polite"
      >
        {format ? format(value) : value}
      </output>
      <button
        type="button"
        className="ui-stepper-button"
        aria-label="Increase"
        disabled={disabled || isAtMax}
        onClick={() => change(step)}
      >
        <Plus size={ICON_SIZE} aria-hidden="true" />
      </button>
    </div>
  )
}
