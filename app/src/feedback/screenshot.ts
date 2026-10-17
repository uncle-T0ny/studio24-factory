import {
  isScreenshotType,
  MAX_SCREENSHOT_BYTES,
  MAX_SCREENSHOT_SIDE_PX,
} from "../../convex/lib/feedback"
import { UserError } from "../lib/errors"

const JPEG_BACKGROUND = "white"

export const SCREENSHOT_ACCEPT = "image/png,image/jpeg,.png,.jpg,.jpeg"

const PNG_TYPE = "image/png"
const JPEG_TYPE = "image/jpeg"
export const MAX_SOURCE_BYTES = 30 * 1024 * 1024
const JPEG_QUALITY = 0.85
const FALLBACK_SIDE_PX = 1600
const FALLBACK_JPEG_QUALITY = 0.8

const NOT_AN_IMAGE = "Choose or paste a PNG or JPG image."
const SOURCE_TOO_BIG = "This image is too big. Choose one under 30 MB."
const UNREADABLE = "This image can't be read. Try another PNG or JPG."
const STILL_TOO_BIG = "This image is too big even after shrinking it. Try a smaller screenshot."

export interface Size {
  width: number
  height: number
}

export interface FileLike {
  type: string
  name: string
}

export interface EncodingStep {
  size: Size
  type: string
  quality?: number
}

export interface PreparedScreenshot {
  blob: Blob
  size: Size
}

export interface PasteInput<T extends FileLike> {
  files: readonly T[]
  hasText: boolean
  isTextTarget: boolean
}

export function fitWithin(size: Size, maxSide: number): Size {
  const longest = Math.max(size.width, size.height)

  if (longest <= maxSide) {
    return {
      width: size.width,
      height: size.height,
    }
  }

  const scale = maxSide / longest

  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  }
}

export function screenshotTypeOf(file: FileLike): string | null {
  if (isScreenshotType(file.type)) {
    return file.type
  }

  const name = file.name.toLowerCase()

  if (name.endsWith(".png")) {
    return PNG_TYPE
  }

  return /\.jpe?g$/.test(name) ? JPEG_TYPE : null
}

export function pastedImage<T extends FileLike>(input: PasteInput<T>): T | null {
  if (input.isTextTarget && input.hasText) {
    return null
  }

  return input.files.find((file) => file.type.startsWith("image/")) ?? null
}

export function canKeepOriginal(size: Size, bytes: number): boolean {
  const longest = Math.max(size.width, size.height)

  return longest <= MAX_SCREENSHOT_SIDE_PX && bytes <= MAX_SCREENSHOT_BYTES
}

export function encodingSteps(size: Size): EncodingStep[] {
  const fitted = fitWithin(size, MAX_SCREENSHOT_SIDE_PX)

  return [
    {
      size: fitted,
      type: PNG_TYPE,
    },
    {
      size: fitted,
      type: JPEG_TYPE,
      quality: JPEG_QUALITY,
    },
    {
      size: fitWithin(size, FALLBACK_SIDE_PX),
      type: JPEG_TYPE,
      quality: FALLBACK_JPEG_QUALITY,
    },
  ]
}

async function encode(bitmap: ImageBitmap, step: EncodingStep): Promise<Blob> {
  const canvas = document.createElement("canvas")

  canvas.width = step.size.width
  canvas.height = step.size.height

  const context = canvas.getContext("2d")

  if (!context) {
    throw new UserError(UNREADABLE)
  }

  if (step.type === JPEG_TYPE) {
    context.fillStyle = JPEG_BACKGROUND
    context.fillRect(0, 0, step.size.width, step.size.height)
  }

  context.drawImage(bitmap, 0, 0, step.size.width, step.size.height)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new UserError(UNREADABLE))),
      step.type,
      step.quality,
    )
  })
}

async function decode(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file)
  } catch {
    throw new UserError(UNREADABLE)
  }
}

export async function prepareScreenshot(file: File): Promise<PreparedScreenshot> {
  const type = screenshotTypeOf(file)

  if (type === null) {
    throw new UserError(NOT_AN_IMAGE)
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new UserError(SOURCE_TOO_BIG)
  }

  const bitmap = await decode(file)
  const size = {
    width: bitmap.width,
    height: bitmap.height,
  }

  try {
    if (canKeepOriginal(size, file.size)) {
      return {
        blob: new Blob([file], { type }),
        size,
      }
    }

    for (const step of encodingSteps(size)) {
      const blob = await encode(bitmap, step)

      if (blob.size <= MAX_SCREENSHOT_BYTES) {
        return {
          blob,
          size: step.size,
        }
      }
    }
  } finally {
    bitmap.close()
  }

  throw new UserError(STILL_TOO_BIG)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
