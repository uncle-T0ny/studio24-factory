export function defined<T>(value: T | undefined, what = "the value"): T {
  if (value === undefined) {
    throw new Error(`Expected ${what}, got undefined`)
  }

  return value
}
