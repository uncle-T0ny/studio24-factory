import { ChevronDown } from "lucide-react"
import { useFieldContext } from "./Field"
import { classNames, ControlSize, type Option } from "./types"

const CHEVRON_SIZE = 14

export interface SelectProps<T extends string> {
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
  size?: ControlSize
  disabled?: boolean
  label?: string
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  size = ControlSize.Medium,
  disabled,
  label,
}: SelectProps<T>) {
  const field = useFieldContext()

  return (
    <span className="ui-select-wrap">
      <select
        id={field?.controlId}
        aria-label={field ? undefined : label}
        aria-describedby={field?.describedById}
        className={classNames("ui-input", `ui-input--${size}`, "ui-select")}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const option = options.find((candidate) => candidate.value === event.target.value)

          if (option) {
            onChange(option.value)
          }
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="ui-select-chevron" size={CHEVRON_SIZE} aria-hidden="true" />
    </span>
  )
}
