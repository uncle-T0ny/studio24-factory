import type { InputHTMLAttributes } from "react"
import { useFieldContext } from "./Field"

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type" | "value" | "onChange"
> {
  value: number
  onChange: (value: number) => void
}

export function Slider({ value, onChange, id, ...rest }: SliderProps) {
  const field = useFieldContext()

  return (
    <input
      {...rest}
      id={id ?? field?.controlId}
      type="range"
      value={value}
      aria-describedby={field?.describedById}
      className="ui-slider"
      onChange={(event) => onChange(Number(event.target.value))}
    />
  )
}
