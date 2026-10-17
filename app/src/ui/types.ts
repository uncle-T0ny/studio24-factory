export enum ControlSize {
  Small = "sm",
  Medium = "md",
  Large = "lg",
}

export enum Tone {
  Neutral = "neutral",
  Accent = "accent",
  Warning = "warning",
  Danger = "danger",
}

export interface Option<T extends string> {
  value: T
  label: string
}

export function classNames(...names: (string | false | null | undefined)[]): string {
  return names.filter((name) => typeof name === "string" && name.length > 0).join(" ")
}
