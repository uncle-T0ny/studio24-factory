import { crc32, deflateSync } from "node:zlib"

export interface Rgb {
  red: number
  green: number
  blue: number
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const BIT_DEPTH = 8
const COLOR_TYPE_RGB = 2
const FILTER_NONE = 0
const BYTES_PER_PIXEL = 3

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  const body = Buffer.concat([Buffer.from(type, "ascii"), data])
  const checksum = Buffer.alloc(4)

  length.writeUInt32BE(data.length)
  checksum.writeUInt32BE(crc32(body))

  return Buffer.concat([length, body, checksum])
}

// A PNG of one opaque colour, made here so the feedback test needs no binary fixture in git.
export function solidPng(width: number, height: number, color: Rgb): Buffer {
  const header = Buffer.alloc(13)

  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = BIT_DEPTH
  header[9] = COLOR_TYPE_RGB

  const row = Buffer.alloc(1 + width * BYTES_PER_PIXEL)

  row[0] = FILTER_NONE

  for (let x = 0; x < width; x += 1) {
    const offset = 1 + x * BYTES_PER_PIXEL

    row[offset] = color.red
    row[offset + 1] = color.green
    row[offset + 2] = color.blue
  }

  const pixels = Buffer.concat(Array.from({ length: height }, () => row))

  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}
