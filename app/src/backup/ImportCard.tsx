import { useConvex } from "convex/react"
import { useState } from "react"
import type { BackupAdapter } from "./adapter"
import { importBackup, type Imported } from "./backupFile"
import { useErrorState } from "../lib/errors"
import { Card, FileButton, FormRow, Heading, HeadingLevel, Text, TextSize, TextTone } from "../ui"

const ACCEPT = ".json,application/json"

export interface ImportCardProps<Content, ResourceId> {
  adapter: BackupAdapter<Content, ResourceId>
  title?: string
}

export function ImportCard<Content, ResourceId>({
  adapter,
  title = "Import project",
}: ImportCardProps<Content, ResourceId>) {
  const convex = useConvex()
  const [isImporting, setIsImporting] = useState(false)
  const [imported, setImported] = useState<Imported<ResourceId> | null>(null)
  const { error, setError, showError } = useErrorState()

  const handleFile = async (file: File) => {
    setIsImporting(true)
    setImported(null)
    setError(null)

    try {
      setImported(await importBackup(convex, adapter, file))
    } catch (caught) {
      showError(caught)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card label={title}>
      <Heading level={HeadingLevel.Section}>{title}</Heading>
      <FormRow>
        <Text tone={TextTone.Muted} size={TextSize.Small}>
          Make a new one from an exported .json file. Existing ones stay as they are.
        </Text>
        <FileButton
          accept={ACCEPT}
          disabled={isImporting}
          aria-busy={isImporting}
          onFile={(file) => {
            void handleFile(file)
          }}
        >
          {isImporting ? "Importing…" : title}
        </FileButton>
      </FormRow>
      {imported ? (
        <Text tone={TextTone.Accent} size={TextSize.Small}>
          Imported "{imported.title}" as a new one with its own share link.
        </Text>
      ) : null}
      {error ? (
        <Text tone={TextTone.Danger} alert>
          {error}
        </Text>
      ) : null}
    </Card>
  )
}
