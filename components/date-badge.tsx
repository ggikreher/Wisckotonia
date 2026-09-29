import { amsterdamParts } from "@/lib/dates"

export function DateBadge({ iso }: { iso: string }) {
  const parts = amsterdamParts(new Date(iso))
  const month = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    month: "short",
  })
    .format(new Date(iso))
    .replace(".", "")

  return (
    <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-border bg-secondary/70 py-2">
      <span className="font-serif text-2xl leading-none">{parts.day}</span>
      <span className="mt-1 text-[11px] tracking-wider text-muted-foreground uppercase">{month}</span>
    </div>
  )
}
