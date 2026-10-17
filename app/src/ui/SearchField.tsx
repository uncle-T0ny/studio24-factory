import { Search, X } from "lucide-react"
import { useRef, type InputHTMLAttributes, type KeyboardEvent } from "react"
import { useFieldContext } from "./Field"
import { IconButton } from "./IconButton"
import { classNames, ControlSize } from "./types"

const ICON_SIZE = 14
const CLEAR_KEY = "Escape"

// Esc clears a field that has text; on an empty field it is left to the page.
export function clearsOnKey(key: string, value: string): boolean {
  return key === CLEAR_KEY && value.length > 0
}

export interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "size" | "type" | "value" | "defaultValue" | "onChange"
> {
  value: string
  onChange: (value: string) => void
  size?: ControlSize.Small | ControlSize.Medium
  clearLabel?: string
}

export function SearchField({
  value,
  onChange,
  size = ControlSize.Medium,
  clearLabel = "Clear search",
  id,
  disabled,
  onKeyDown,
  ...rest
}: SearchFieldProps) {
  const field = useFieldContext()
  const inputRef = useRef<HTMLInputElement>(null)

  const clear = () => {
    onChange("")
    inputRef.current?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)

    if (!event.defaultPrevented && clearsOnKey(event.key, value)) {
      event.preventDefault()
      event.stopPropagation()
      onChange("")
    }
  }

  return (
    <span className="ui-search">
      <span className="ui-search-icon" aria-hidden="true">
        <Search size={ICON_SIZE} />
      </span>
      <input
        autoComplete="off"
        spellCheck={false}
        {...rest}
        ref={inputRef}
        id={id ?? field?.controlId}
        type="search"
        value={value}
        disabled={disabled}
        aria-describedby={field?.describedById}
        className={classNames("ui-input", `ui-input--${size}`, "ui-search-input")}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {value.length > 0 ? (
        <span className="ui-search-clear">
          <IconButton
            label={clearLabel}
            icon={<X size={ICON_SIZE} />}
            disabled={disabled}
            onClick={clear}
          />
        </span>
      ) : null}
    </span>
  )
}
