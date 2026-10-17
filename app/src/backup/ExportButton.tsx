import { useConvex } from "convex/react"
import { Download } from "lucide-react"
import { useState } from "react"
import type { BackupAdapter } from "./adapter"
import { exportBackup } from "./backupFile"
import { useErrorToast } from "../lib/errors"
import { Button, Toast, Tone } from "../ui"

const ICON_SIZE = 14
const ERROR_VISIBLE_MS = 5000

export interface ExportButtonProps<Content, ResourceId> {
  adapter: BackupAdapter<Content, ResourceId>
  id: ResourceId
  label?: string
}

export function ExportButton<Content, ResourceId>({
  adapter,
  id,
  label = "Export project",
}: ExportButtonProps<Content, ResourceId>) {
  const convex = useConvex()
  const [isExporting, setIsExporting] = useState(false)
  const { error, showError } = useErrorToast(ERROR_VISIBLE_MS)

  const handleClick = async () => {
    setIsExporting(true)

    try {
      await exportBackup(convex, adapter, id)
    } catch (caught) {
      showError(caught)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Button
        icon={<Download size={ICON_SIZE} />}
        disabled={isExporting}
        title="Download it as one .json file"
        aria-busy={isExporting}
        onClick={() => {
          void handleClick()
        }}
      >
        {isExporting ? "Exporting…" : label}
      </Button>
      {error ? (
        <Toast tone={Tone.Danger} fixed>
          {error}
        </Toast>
      ) : null}
    </>
  )
}
