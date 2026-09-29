const TIME_ZONE = "Europe/Amsterdam"

type AmsterdamParts = {
  year: number
  month: number
  day: number
  hour: string
  minute: string
  key: string
}

export function amsterdamParts(date: Date): AmsterdamParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""

  const hour = get("hour") === "24" ? "00" : get("hour")
  const year = get("year")
  const month = get("month")
  const day = get("day")

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour,
    minute: get("minute"),
    key: `${year}-${month}-${day}`,
  }
}

export function amsterdamLocalToDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null
  }

  let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  for (let pass = 0; pass < 2; pass += 1) {
    const shown = amsterdamParts(utc)
    const shownUtc = Date.UTC(
      shown.year,
      shown.month - 1,
      shown.day,
      Number(shown.hour),
      Number(shown.minute),
      0,
    )
    const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
    utc = new Date(utc.getTime() - (shownUtc - desiredUtc))
  }

  return utc
}

export function toDateTimeLocalValue(date: Date) {
  const parts = amsterdamParts(date)
  return `${parts.key}T${parts.hour}:${parts.minute}`
}

export function formatEventWhen(date: Date) {
  const datePart = new Intl.DateTimeFormat("nl-NL", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
  const timePart = formatTime(date)
  return `${datePart} · ${timePart}`
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("nl-NL", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export function greetingForNow(name: string) {
  const hour = Number(
    new Intl.DateTimeFormat("nl-NL", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  )
  const hello =
    hour < 6 ? "Goedenacht" : hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond"
  const first = name.trim().split(/\s+/)[0] || name
  return `${hello}, ${first}`
}
