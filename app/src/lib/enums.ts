export function enumGuard<E extends string>(
  enumObject: Record<string, E>,
): (value: string) => value is E {
  const values: ReadonlySet<string> = new Set(Object.values(enumObject))

  return (value: string): value is E => values.has(value)
}
