import { ConvexError } from "convex/values"
import { useCallback, useState, type Dispatch, type SetStateAction } from "react"
import { useTimedState } from "./useTimedState"

const FALLBACK_MESSAGE = "Something went wrong. Please try again."

export class UserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserError"
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof UserError) {
    return error.message
  }

  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data
  }

  return FALLBACK_MESSAGE
}

export function reportError(caught: unknown): string {
  console.error(caught)

  return errorMessage(caught)
}

export interface ErrorState {
  error: string | null
  setError: Dispatch<SetStateAction<string | null>>
  showError: (caught: unknown) => void
}

function useErrorStateOf([error, setError]: [
  string | null,
  Dispatch<SetStateAction<string | null>>,
]): ErrorState {
  const showError = useCallback((caught: unknown) => setError(reportError(caught)), [setError])

  return { error, setError, showError }
}

export function useErrorState(): ErrorState {
  return useErrorStateOf(useState<string | null>(null))
}

export function useErrorToast(visibleMs: number): ErrorState {
  return useErrorStateOf(useTimedState<string | null>(null, visibleMs))
}
