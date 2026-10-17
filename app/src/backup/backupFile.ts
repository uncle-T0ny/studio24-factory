import type { ConvexReactClient } from "convex/react"
import type { BackupAdapter } from "./adapter"
import { saveFile } from "./saveFile"
import { backupEnvelopeOf, backupFileName } from "../../convex/lib/backup"

const JSON_TYPE = "application/json"
const JSON_INDENT = 2

export interface Imported<ResourceId> {
  id: ResourceId
  title: string
}

// Downloads one resource as a JSON export file: the versioned envelope around its content.
export async function exportBackup<Content, ResourceId>(
  convex: ConvexReactClient,
  adapter: BackupAdapter<Content, ResourceId>,
  id: ResourceId,
): Promise<void> {
  const content = await adapter.read(convex, id)
  const exportedAt = new Date().toISOString()
  const text = JSON.stringify(backupEnvelopeOf(content, exportedAt), null, JSON_INDENT)

  saveFile(
    backupFileName(adapter.title(content), exportedAt),
    new Blob([text], { type: JSON_TYPE }),
  )
}

// Makes a new resource from an export file.
export async function importBackup<Content, ResourceId>(
  convex: ConvexReactClient,
  adapter: BackupAdapter<Content, ResourceId>,
  file: File,
): Promise<Imported<ResourceId>> {
  const content = adapter.parse(await file.text())
  const id = await adapter.write(convex, content)

  return {
    id,
    title: adapter.title(content),
  }
}
