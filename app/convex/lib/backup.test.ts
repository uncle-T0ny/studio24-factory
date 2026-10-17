import { describe, expect, it } from "vitest"
import { BACKUP_FORMAT } from "./appConfig"
import { BACKUP_VERSION, backupEnvelopeOf, backupFileName, parseProjectBackup } from "./backup"

const EXPORTED_AT = "2026-10-17T10:00:00.000Z"
const CONTENT = { project: { name: "Spring launch" } }

function fileText(value: unknown): string {
  return JSON.stringify(value)
}

describe("backupEnvelopeOf", () => {
  it("wraps the content in the app's format and version", () => {
    expect(backupEnvelopeOf(CONTENT, EXPORTED_AT)).toEqual({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: EXPORTED_AT,
      data: CONTENT,
    })
  })
})

describe("parseProjectBackup", () => {
  it("reads back what the export wrote", () => {
    const envelope = backupEnvelopeOf(CONTENT, EXPORTED_AT)

    expect(parseProjectBackup(fileText(envelope))).toEqual(envelope)
  })

  it("refuses a file that isn't JSON or isn't this app's export", () => {
    expect(() => parseProjectBackup("not json")).toThrow("isn't a")
    expect(() => parseProjectBackup(fileText({ format: "another-app", version: 1 }))).toThrow(
      "isn't a",
    )
    expect(() => parseProjectBackup(fileText([]))).toThrow("isn't a")
  })

  it("refuses another format version", () => {
    const later = { ...backupEnvelopeOf(CONTENT, EXPORTED_AT), version: BACKUP_VERSION + 1 }

    expect(() => parseProjectBackup(fileText(later))).toThrow(
      `This export is format version ${BACKUP_VERSION + 1}`,
    )
  })

  it("refuses damaged data and says where", () => {
    const damaged = backupEnvelopeOf({ project: { name: 42 } }, EXPORTED_AT)
    const extra = backupEnvelopeOf({ project: { name: "A", ownerId: "x" } }, EXPORTED_AT)

    expect(() => parseProjectBackup(fileText(damaged))).toThrow("damaged")
    expect(() => parseProjectBackup(fileText(damaged))).toThrow("project.name")
    expect(() => parseProjectBackup(fileText(extra))).toThrow("damaged")
  })
})

describe("backupFileName", () => {
  it("names the file after the project and the export date", () => {
    expect(backupFileName("Spring launch", EXPORTED_AT)).toBe(
      "Spring launch - Project export - 2026-10-17.json",
    )
  })

  it("drops what a file name can't hold, and falls back when nothing is left", () => {
    expect(backupFileName('A/B: "C"', EXPORTED_AT)).toBe("AB C - Project export - 2026-10-17.json")
    expect(backupFileName(" / ", "")).toBe("Project - Project export.json")
  })
})
