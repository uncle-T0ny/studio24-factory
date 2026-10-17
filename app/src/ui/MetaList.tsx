import type { ReactNode } from "react"

export interface MetaEntry {
  label: string
  value: ReactNode
}

export interface MetaListProps {
  entries: readonly MetaEntry[]
  label?: string
}

// Label and value pairs in small text, e.g. the context sent with a feedback entry.
export function MetaList({ entries, label }: MetaListProps) {
  return (
    <dl className="ui-meta-list" aria-label={label}>
      {entries.map((entry) => (
        <div key={entry.label} className="ui-meta-row">
          <dt className="ui-meta-label">{entry.label}</dt>
          <dd className="ui-meta-value">{entry.value}</dd>
        </div>
      ))}
    </dl>
  )
}
