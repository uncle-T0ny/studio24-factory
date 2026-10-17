import { useState } from "react"

export function useDraft(value: string, isEditing = false) {
  const [draft, setDraft] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)

  if (!isEditing && value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value)
  }

  const reset = () => {
    setSyncedValue(value)
    setDraft(value)
  }

  return [draft, setDraft, reset] as const
}
