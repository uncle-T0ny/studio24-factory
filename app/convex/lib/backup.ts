import { ConvexError, type Validator } from "convex/values"
import { validate, ValidationError } from "convex-helpers/validators"
import { APP_NAME, BACKUP_FORMAT } from "./appConfig"
import { projectContentValidator, type ProjectContent } from "./validators"

// A project export: one JSON file, a versioned envelope {format, version, exportedAt, data}
// around the resource's own content. The envelope is generic; `data` is checked against the
// resource's validator (projectContentValidator for the example). Shared by convex/backup.ts and
// the browser (src/backup/), which builds and reads the file.

export const BACKUP_VERSION = 1

const NOT_AN_EXPORT = `This file isn't a ${APP_NAME} project export.`
const FILE_NAME_FORBIDDEN = /[\\/:*?"<>|]/g
const FALLBACK_FILE_NAME = "Project"

export interface BackupEnvelope<T> {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: string
  data: T
}

export function backupEnvelopeOf<T>(data: T, exportedAt: string): BackupEnvelope<T> {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    data,
  }
}

function hasField(value: unknown, field: string): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && field in value
}

function assertFormatAndVersion(value: unknown): asserts value is Record<string, unknown> {
  const isExport = hasField(value, "format") && value.format === BACKUP_FORMAT

  if (!isExport) {
    throw new ConvexError(NOT_AN_EXPORT)
  }

  const version = hasField(value, "version") ? value.version : undefined

  if (version !== BACKUP_VERSION) {
    throw new ConvexError(
      `This export is format version ${String(version)}. This app imports version ${BACKUP_VERSION} only.`,
    )
  }
}

function assertData<T>(validator: Validator<T, "required", string>, data: unknown): T {
  try {
    validate(validator, data, { throw: true })
  } catch (caught) {
    const where = caught instanceof ValidationError && caught.path ? ` at ${caught.path}` : ""

    throw new ConvexError(`This export is damaged and can't be imported (bad value${where}).`)
  }

  return data as T
}

// Reads an export's text: the envelope's format and version first, then its data's shape.
export function parseBackup<T>(
  text: string,
  validator: Validator<T, "required", string>,
): BackupEnvelope<T> {
  let value: unknown

  try {
    value = JSON.parse(text)
  } catch {
    throw new ConvexError(NOT_AN_EXPORT)
  }

  assertFormatAndVersion(value)

  const exportedAt = typeof value.exportedAt === "string" ? value.exportedAt : ""

  return backupEnvelopeOf(assertData(validator, value.data), exportedAt)
}

export function parseProjectBackup(text: string): BackupEnvelope<ProjectContent> {
  return parseBackup(text, projectContentValidator)
}

// "<name> - Project export - <date>.json", with the characters a file name can't hold dropped.
export function backupFileName(name: string, exportedAt: string): string {
  const safeName = name.replace(FILE_NAME_FORBIDDEN, "").replace(/\s+/g, " ").trim()
  const date = exportedAt.slice(0, "yyyy-mm-dd".length)
  const parts = [safeName || FALLBACK_FILE_NAME, "Project export"]

  if (date) {
    parts.push(date.replace(FILE_NAME_FORBIDDEN, "-"))
  }

  return `${parts.join(" - ")}.json`
}
