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

// "Jun 12, 2027" from an ISO date (yyyy-mm-dd); the text as it is when it isn't one.
export function formatIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  return DATE_FORMAT.format(date)
}

// "Oct 16, 2026, 3:04 PM" from a timestamp (ms), in the browser's time zone.
export function formatTimestamp(timestamp: number, timeZone?: string): string {
  return new Date(timestamp).toLocaleString("en-US", { ...DATE_TIME_FORMAT, timeZone })
}
