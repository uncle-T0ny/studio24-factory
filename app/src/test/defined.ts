// For tests under noUncheckedIndexedAccess: the value, or a failure that names what was missing,
// where a `!` would only defer it to a TypeError.
export function defined<T>(value: T | undefined, what = "the value"): T {
  if (value === undefined) {
    throw new Error(`Expected ${what}, got undefined`)
  }

  return value
}
