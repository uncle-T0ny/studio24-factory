import type { ButtonHTMLAttributes, ReactNode } from "react"
import type { Option } from "./types"

export interface TabListProps {
  label: string
  children: ReactNode
}

export function TabList({ label, children }: TabListProps) {
  return (
    <nav className="ui-tab-list" aria-label={label}>
      {children}
    </nav>
  )
}

export interface TabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  selected: boolean
}

export function Tab({ selected, type = "button", children, ...rest }: TabProps) {
  return (
    <button {...rest} type={type} className="ui-tab" aria-current={selected ? "page" : undefined}>
      {children}
    </button>
  )
}

export interface TabEditorProps {
  children: ReactNode
}

export function TabEditor({ children }: TabEditorProps) {
  return <span className="ui-tab-editing">{children}</span>
}

export interface TabsProps<T extends string> {
  label: string
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
}

export function Tabs<T extends string>({ label, value, options, onChange }: TabsProps<T>) {
  return (
    <TabList label={label}>
      {options.map((option) => (
        <Tab
          key={option.value}
          selected={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Tab>
      ))}
    </TabList>
  )
}
