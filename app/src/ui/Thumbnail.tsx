import { useState } from "react"
import { Dialog, DialogSize } from "./Dialog"

export interface ThumbnailProps {
  src: string
  alt: string
}

export function Thumbnail({ src, alt }: ThumbnailProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="ui-thumbnail"
        aria-label={`Enlarge ${alt.toLowerCase()}`}
        title="Click to enlarge"
        onClick={() => setIsOpen(true)}
      >
        <img className="ui-thumbnail-image" src={src} alt="" />
      </button>
      <Dialog
        title={alt}
        open={isOpen}
        size={DialogSize.Wide}
        closeOnBackdrop
        onClose={() => setIsOpen(false)}
      >
        <img className="ui-dialog-image" src={src} alt={alt} />
      </Dialog>
    </>
  )
}
