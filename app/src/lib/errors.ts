import { ConvexError } from "convex/values"
import { useCallback, useState, type Dispatch, type SetStateAction } from "react"
import { useTimedState } from "./useTimedState"

const FALLBACK_MESSAGE = "Something went wrong. Please try again."

// An error whose message is written for the user. Client code throws it where the server would
// throw a ConvexError with a string, so that errorMessage shows its text.
export class UserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserError"
  }
}

// The text to show for a caught error: a UserError's message, the string a ConvexError carries
// from the server, or a generic sentence for anything else (a bug, a network failure).
export function errorMessage(error: unknown): string {
  if (error instanceof UserError) {
    return error.message
  }

  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data
  }

  return FALLBACK_MESSAGE
}

// Logs a caught error for debugging and returns the text to show the user.
export function reportError(caught: unknown): string {
  console.error(caught)

  return errorMessage(caught)
}

export interface ErrorState {
  error: string | null
  setError: Dispatch<SetStateAction<string | null>>
  // For a catch block: logs the error and shows its message.
  showError: (caught: unknown) => void
}

function useErrorStateOf([error, setError]: [
  string | null,
  Dispatch<SetStateAction<string | null>>,
]): ErrorState {
  const showError = useCallback((caught: unknown) => setError(reportError(caught)), [setError])

  return { error, setError, showError }
}

// The error a form or a panel shows inline until the next attempt clears it.
export function useErrorState(): ErrorState {
  return useErrorStateOf(useState<string | null>(null))
}

// The error a toast shows for `visibleMs`.
export function useErrorToast(visibleMs: number): ErrorState {
  return useErrorStateOf(useTimedState<string | null>(null, visibleMs))
}
