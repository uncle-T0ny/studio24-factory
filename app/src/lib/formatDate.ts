const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
}

export function formatIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  return DATE_FORMAT.format(date)
}

export function formatTimestamp(timestamp: number, timeZone?: string): string {
  return new Date(timestamp).toLocaleString("en-US", { ...DATE_TIME_FORMAT, timeZone })
}
