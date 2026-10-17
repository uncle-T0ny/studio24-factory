// A type guard for a string enum: is an outside string (a key name, a stored value) one of its
// values? Comparing the raw string with a member directly is what the lint rule refuses.
export function enumGuard<E extends string>(
  enumObject: Record<string, E>,
): (value: string) => value is E {
  const values: ReadonlySet<string> = new Set(Object.values(enumObject))

  return (value: string): value is E => values.has(value)
}
