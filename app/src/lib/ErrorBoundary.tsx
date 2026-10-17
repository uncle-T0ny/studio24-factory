import { Component, type ErrorInfo, type ReactNode } from "react"

export interface ErrorBoundaryProps {
  // What to render instead of the children once one of them throws while rendering.
  fallback: (error: unknown) => ReactNode
  // A change of this value (the page's path) drops a caught error and renders the children again.
  resetKey?: string
  children: ReactNode
}

interface ErrorBoundaryState {
  caught: { error: unknown } | null
}

// React catches render errors only in a class component; without one a render error blanks the app.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { caught: null }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { caught: { error } }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  componentDidUpdate(previous: ErrorBoundaryProps) {
    if (this.state.caught && previous.resetKey !== this.props.resetKey) {
      this.setState({ caught: null })
    }
  }

  render() {
    return this.state.caught ? this.props.fallback(this.state.caught.error) : this.props.children
  }
}
