import { useRef, type ChangeEvent } from "react"
import { Button, type ButtonProps } from "./Button"

export interface FileButtonProps extends Omit<ButtonProps, "onClick" | "type"> {
  accept: string
  onFile: (file: File) => void
}

export function FileButton({ accept, onFile, ...button }: FileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    event.target.value = ""

    if (file) {
      onFile(file)
    }
  }

  return (
    <>
      <Button {...button} onClick={() => inputRef.current?.click()} />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleChange}
      />
    </>
  )
}
