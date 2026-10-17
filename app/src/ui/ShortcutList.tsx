import type { ReactNode } from "react"

export interface KbdProps {
  children: ReactNode
}

export function Kbd({ children }: KbdProps) {
  return <kbd className="ui-kbd">{children}</kbd>
}

export interface ShortcutEntry {
  keys: readonly string[]
  label: string
}

export interface ShortcutListProps {
  shortcuts: readonly ShortcutEntry[]
}

export function ShortcutList({ shortcuts }: ShortcutListProps) {
  return (
    <dl className="ui-shortcut-list">
      {shortcuts.map((shortcut) => (
        <div key={shortcut.label} className="ui-shortcut-row">
          <dt className="ui-shortcut-label">{shortcut.label}</dt>
          <dd className="ui-shortcut-keys">
            {shortcut.keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  )
}
