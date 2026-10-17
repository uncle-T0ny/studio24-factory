import type { ReactNode } from "react"

export interface EmptyStateProps {
  children: ReactNode
}

export function EmptyState({ children }: EmptyStateProps) {
  return <p className="ui-empty-state">{children}</p>
}

export interface PageMessageProps {
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
}

export function PageMessage({ title, children, action }: PageMessageProps) {
  return (
    <div className="ui-page-message" role="status">
      {title ? <p className="ui-page-message-title">{title}</p> : null}
      {children ? <div>{children}</div> : null}
      {action}
    </div>
  )
}
