import { useRef, type KeyboardEvent } from "react"
import { useFieldContext } from "./Field"
import type { Option } from "./types"
import { enumGuard } from "../lib/enums"

enum SegmentKey {
  Next = "ArrowRight",
  NextDown = "ArrowDown",
  Previous = "ArrowLeft",
  PreviousUp = "ArrowUp",
  First = "Home",
  Last = "End",
}

const isSegmentKey = enumGuard(SegmentKey)

// The option a key moves to from `index` (-1 when none is selected), wrapping at both ends.
function targetIndex(key: SegmentKey, index: number, count: number): number {
  switch (key) {
    case SegmentKey.Next:
    case SegmentKey.NextDown:
      return (index + 1) % count
    case SegmentKey.Previous:
    case SegmentKey.PreviousUp:
      return index <= 0 ? count - 1 : index - 1
    case SegmentKey.First:
      return 0
    case SegmentKey.Last:
      return count - 1
  }
}

export function nextSegmentValue<T extends string>(
  options: readonly Option<T>[],
  value: T,
  key: string,
): T | null {
  const count = options.length

  if (count === 0 || !isSegmentKey(key)) {
    return null
  }

  const index = options.findIndex((option) => option.value === value)

  return options[targetIndex(key, index, count)]?.value ?? null
}

export interface SegmentedControlProps<T extends string> {
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  label?: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  label,
}: SegmentedControlProps<T>) {
  const field = useFieldContext()
  const buttonsRef = useRef(new Map<T, HTMLButtonElement>())
  const hasSelection = options.some((option) => option.value === value)

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = nextSegmentValue(options, value, event.key)

    if (next === null) {
      return
    }

    event.preventDefault()
    buttonsRef.current.get(next)?.focus()

    if (next !== value) {
      onChange(next)
    }
  }

  return (
    <div
      className="ui-segmented"
      role="radiogroup"
      id={field?.controlId}
      aria-labelledby={field?.labelId}
      aria-label={field ? undefined : label}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value
        const isFocusable = isSelected || (!hasSelection && index === 0)

        return (
          <button
            key={option.value}
            ref={(element) => {
              if (element) {
                buttonsRef.current.set(option.value, element)
              } else {
                buttonsRef.current.delete(option.value)
              }
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isFocusable ? 0 : -1}
            className="ui-segment"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={handleKeyDown}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
