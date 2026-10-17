import type { ReactNode } from "react"
import { Button, ButtonVariant } from "./Button"
import { useFieldContext } from "./Field"
import { FileButton } from "./FileButton"
import { Thumbnail } from "./Thumbnail"
import { classNames, ControlSize } from "./types"

export interface ImageInputValue {
  src: string
  alt: string
  meta?: ReactNode
}

export interface ImageInputProps {
  image: ImageInputValue | null
  accept: string
  onFile: (file: File) => void
  onRemove: () => void
  hint: ReactNode
  chooseLabel?: string
  busy?: boolean
}

export function ImageInput({
  image,
  accept,
  onFile,
  onRemove,
  hint,
  chooseLabel = "Choose image",
  busy = false,
}: ImageInputProps) {
  const field = useFieldContext()

  return (
    <div
      className={classNames("ui-image-input", image ? "ui-image-input--filled" : null)}
      aria-busy={busy || undefined}
    >
      {image ? (
        <>
          <Thumbnail src={image.src} alt={image.alt} />
          <div className="ui-image-input-meta">{image.meta}</div>
          <Button
            id={field?.controlId}
            variant={ButtonVariant.Link}
            size={ControlSize.Small}
            disabled={busy}
            onClick={onRemove}
          >
            Remove
          </Button>
        </>
      ) : (
        <>
          <p className="ui-image-input-hint">{hint}</p>
          <FileButton
            id={field?.controlId}
            aria-describedby={field?.describedById}
            size={ControlSize.Small}
            accept={accept}
            disabled={busy}
            onFile={onFile}
          >
            {busy ? "Preparing…" : chooseLabel}
          </FileButton>
        </>
      )}
    </div>
  )
}
