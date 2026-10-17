import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

export function useTimedState<T>(resting: T, visibleMs: number): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(resting)

  useEffect(() => {
    if (Object.is(value, resting)) {
      return
    }

    const timeout = window.setTimeout(() => setValue(resting), visibleMs)

    return () => window.clearTimeout(timeout)
  }, [value, resting, visibleMs])

  return [value, setValue]
}
