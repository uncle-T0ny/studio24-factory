import { UserError } from "../lib/errors"

const CHUNK_SIZE = 0x8000
const BASE64_DATA_URL = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/

export interface DataUrlContent {
  contentType: string
  bytes: Uint8Array<ArrayBuffer>
}

export function bytesToDataUrl(contentType: string, bytes: Uint8Array): string {
  let binary = ""

  for (let start = 0; start < bytes.length; start += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK_SIZE))
  }

  return `data:${contentType};base64,${btoa(binary)}`
}

export function dataUrlToBytes(dataUrl: string): DataUrlContent {
  const [, contentType, base64] = BASE64_DATA_URL.exec(dataUrl) ?? []

  if (contentType === undefined || base64 === undefined) {
    throw new UserError("A file in the export can't be read.")
  }

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return {
    contentType,
    bytes,
  }
}
