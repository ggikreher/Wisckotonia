"use client"

import { Clock, MapPin } from "lucide-react"
import { useActionState, useEffect, useMemo, useState } from "react"
import { ConfirmDelete } from "@/components/confirm-delete"
import { DateBadge } from "@/components/date-badge"
import { EmptyState } from "@/components/empty-state"
import { Field, FormError } from "@/components/form-feedback"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { deleteEvent, saveEvent } from "@/lib/actions/events"
import {
  amsterdamParts,
  calendarKey,
  formatDayMonth,
  formatMonthLabel,
  formatTime,
  formatTypedDateTime,
  nextBirthday,
  observedBirthday,
} from "@/lib/dates"
import type { BirthdayDTO, EventDTO } from "@/lib/types"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"]

function monthCells(year: number, month: number) {
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: { key: string; day: number; inMonth: boolean }[] = []

  const previousMonth = month === 1 ? 12 : month - 1
  const previousYear = month === 1 ? year - 1 : year
  const previousDays = new Date(Date.UTC(previousYear, previousMonth, 0)).getUTCDate()

  for (let index = 0; index < firstWeekday; index += 1) {
    const day = previousDays - firstWeekday + index + 1
    cells.push({
      key: `${previousYear}-${String(previousMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      inMonth: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      inMonth: true,
    })
  }

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`,
      day: nextDay,
      inMonth: false,
    })
    nextDay += 1
  }

  return cells
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
}

function EventForm({ event, onDone }: { event?: EventDTO | null; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveEvent, {})

  useEffect(() => {
    if (state.nonce) onDone()
  }, [state.nonce, onDone])

  return (
    <form action={action} className="space-y-4">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <Field label="Titel" htmlFor="title">
        <Input id="title" name="title" defaultValue={event?.title} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Begin" htmlFor="startsAt" hint="Typ de datum en tijd, bijvoorbeeld 29-09-2026 20:00.">
          <Input
            id="startsAt"
            name="startsAt"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="29-09-2026 20:00"
            defaultValue={event ? formatTypedDateTime(new Date(event.startsAt)) : undefined}
            required
          />
        </Field>
        <Field label="Einde" htmlFor="endsAt" hint="Optioneel. Zelfde vorm, bijvoorbeeld 29-09-2026 23:00.">
          <Input
            id="endsAt"
            name="endsAt"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="29-09-2026 23:00"
            defaultValue={event?.endsAt ? formatTypedDateTime(new Date(event.endsAt)) : undefined}
          />
        </Field>
      </div>
      <Field label="Locatie" htmlFor="location">
        <Input id="location" name="location" defaultValue={event?.location} required />
      </Field>
      <Field label="Beschrijving" htmlFor="description">
        <Textarea id="description" name="description" defaultValue={event?.description} required />
      </Field>
      <FormError message={state.error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Annuleren
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Opslaan"}
        </Button>
      </div>
    </form>
  )
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? ""
  if (names.length === 2) return `${names[0]} en ${names[1]}`
  return `${names.slice(0, -1).join(", ")} en ${names[names.length - 1]}`
}

function BirthdayBadge({ year, month, day }: { year: number; month: number; day: number }) {
  const label = new Intl.DateTimeFormat("nl-NL", { timeZone: "UTC", month: "short" })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .replace(".", "")

  return (
    <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-[#b7e4c7] bg-[#e7f8ec] py-2 text-[#14532d]">
      <span className="font-serif text-2xl leading-none">{day}</span>
      <span className="mt-1 text-[11px] tracking-wider uppercase">{label}</span>
    </div>
  )
}

export function AgendaView({
  events,
  birthdays,
  now,
}: {
  events: EventDTO[]
  birthdays: BirthdayDTO[]
  now: string
}) {
  const nowMs = new Date(now).getTime()
  const today = useMemo(() => amsterdamParts(new Date(now)), [now])
  const [cursor, setCursor] = useState({ year: today.year, month: today.month })
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<EventDTO | null>(null)

  const keysWithEvents = useMemo(() => {
    const keys = new Set<string>()
    for (const event of events) keys.add(amsterdamParts(new Date(event.startsAt)).key)
    return keys
  }, [events])

  const cells = useMemo(() => monthCells(cursor.year, cursor.month), [cursor.year, cursor.month])

  const birthdaysByDay = useMemo(() => {
    const map = new Map<string, BirthdayDTO[]>()
    const years = new Set(cells.map((cell) => Number(cell.key.slice(0, 4))))
    for (const year of years) {
      for (const birthday of birthdays) {
        const observed = observedBirthday(year, birthday.month, birthday.day)
        const key = calendarKey(observed.year, observed.month, observed.day)
        const list = map.get(key) ?? []
        list.push(birthday)
        map.set(key, list)
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name, "nl"))
    return map
  }, [birthdays, cells])

  const upcomingBirthday = useMemo(() => {
    const ranked = birthdays
      .map((birthday) => ({ birthday, occurrence: nextBirthday(birthday, today) }))
      .sort(
        (a, b) =>
          a.occurrence.key.localeCompare(b.occurrence.key) || a.birthday.name.localeCompare(b.birthday.name, "nl"),
      )
    const first = ranked[0]
    if (!first) return null
    const people = ranked.filter((item) => item.occurrence.key === first.occurrence.key)
    return { occurrence: first.occurrence, people }
  }, [birthdays, today])

  const visible = events.filter((event) => {
    const key = amsterdamParts(new Date(event.startsAt)).key
    if (selectedKey) return key === selectedKey
    const [year, month] = key.split("-").map(Number)
    return year === cursor.year && month === cursor.month
  })

  const nextEvent = events.find((event) => new Date(event.startsAt).getTime() >= nowMs)

  const birthdayRows = (selectedKey ? [selectedKey] : cells.filter((cell) => cell.inMonth).map((cell) => cell.key))
    .flatMap((key) => {
      const [year, month, day] = key.split("-").map(Number)
      return (birthdaysByDay.get(key) ?? []).map((birthday) => ({
        birthday,
        key,
        year,
        month,
        day,
        age: year - birthday.year,
      }))
    })
    .sort((a, b) => a.key.localeCompare(b.key) || a.birthday.name.localeCompare(b.birthday.name, "nl"))

  function openDay(key: string) {
    const [year, month] = key.split("-").map(Number)
    setCursor({ year, month })
    setSelectedKey(key)
  }

  return (
    <>
      <PageHeader
        eyebrow="Kalender"
        title="Agenda"
        description="Iedereen kan een evenement toevoegen. Je past alleen je eigen evenementen aan. Beheerders kunnen alles wijzigen."
        action={
          <Button type="button" onClick={() => setCreating(true)}>
            Evenement toevoegen
          </Button>
        }
      />

      {nextEvent || upcomingBirthday ? (
        <div className={cn("mb-6 grid gap-3", nextEvent && upcomingBirthday && "sm:grid-cols-2")}>
          {nextEvent ? (
            <button
              type="button"
              onClick={() => openDay(amsterdamParts(new Date(nextEvent.startsAt)).key)}
              className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-brass/50"
            >
              <span>
                <span className="block text-[11px] tracking-[0.16em] text-brass uppercase">Eerstvolgende</span>
                <span className="mt-1 block font-serif text-xl">{nextEvent.title}</span>
              </span>
              <span className="text-sm text-muted-foreground">{formatTime(new Date(nextEvent.startsAt))}</span>
            </button>
          ) : null}
          {upcomingBirthday ? (
            <button
              type="button"
              onClick={() => openDay(upcomingBirthday.occurrence.key)}
              className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#b7e4c7] bg-[#f3fbf5] px-4 py-3 text-left hover:border-[#7dcea0]"
            >
              <span>
                <span className="block text-[11px] tracking-[0.16em] text-[#1b7a45] uppercase">
                  Eerstvolgende verjaardag
                </span>
                <span className="mt-1 block font-serif text-xl">
                  {joinNames(upcomingBirthday.people.map((person) => person.birthday.name))}
                </span>
              </span>
              <span className="text-right text-sm text-muted-foreground">
                <span className="block">
                  {upcomingBirthday.occurrence.key === today.key
                    ? "Vandaag"
                    : formatDayMonth(
                        upcomingBirthday.occurrence.year,
                        upcomingBirthday.occurrence.month,
                        upcomingBirthday.occurrence.day,
                      )}
                </span>
                {upcomingBirthday.people.length === 1 ? (
                  <span className="block">wordt {upcomingBirthday.people[0]?.occurrence.age}</span>
                ) : null}
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-serif text-xl capitalize">{formatMonthLabel(cursor.year, cursor.month)}</h2>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCursor(shiftMonth(cursor.year, cursor.month, -1))
                  setSelectedKey(null)
                }}
                aria-label="Vorige maand"
              >
                ←
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCursor({ year: today.year, month: today.month })
                  setSelectedKey(today.key)
                }}
              >
                Vandaag
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCursor(shiftMonth(cursor.year, cursor.month, 1))
                  setSelectedKey(null)
                }}
                aria-label="Volgende maand"
              >
                →
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] tracking-wide text-muted-foreground uppercase">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const selected = selectedKey === cell.key
              const hasEvent = keysWithEvents.has(cell.key)
              const hasBirthday = birthdaysByDay.has(cell.key)
              const isToday = cell.key === today.key
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => openDay(cell.key)}
                  aria-pressed={selected}
                  aria-label={hasBirthday ? `${cell.key}, verjaardag` : cell.key}
                  className={cn(
                    "relative flex h-10 items-center justify-center rounded-md text-sm",
                    hasBirthday && hasEvent
                      ? "bg-[#b7e4c7] text-[#14532d] shadow-[inset_0_0_0_2px_#000080]"
                      : hasBirthday
                        ? "bg-[#b7e4c7] text-[#14532d]"
                        : hasEvent || selected
                          ? "bg-primary text-primary-foreground"
                          : cn(cell.inMonth ? "text-foreground" : "text-muted-foreground/50", "hover:bg-secondary"),
                    selected ? "ring-2 ring-brass" : isToday ? "ring-1 ring-brass" : null,
                  )}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-primary" />
              Evenement
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-[#b7e4c7]" />
              Verjaardag
            </span>
          </div>
          {selectedKey ? (
            <button
              type="button"
              className="mt-3 text-sm text-primary underline-offset-2 hover:underline"
              onClick={() => setSelectedKey(null)}
            >
              Hele maand tonen
            </button>
          ) : null}
        </section>

        <section className="space-y-3">
          {visible.length === 0 && birthdayRows.length === 0 ? (
            <EmptyState
              title="Geen evenementen"
              text={selectedKey ? "Op deze dag staat niets gepland." : "In deze maand staat niets gepland."}
            />
          ) : (
            [...birthdayRows.map((row) => ({ kind: "birthday" as const, sort: row.key, row })), ...visible.map((event) => ({
              kind: "event" as const,
              sort: `${amsterdamParts(new Date(event.startsAt)).key}T${event.startsAt}`,
              event,
            }))]
              .sort((a, b) => a.sort.localeCompare(b.sort))
              .map((item) => {
                if (item.kind === "birthday") {
                  const row = item.row
                  return (
                    <article
                      key={`${row.birthday.id}-${row.key}`}
                      className="flex gap-4 rounded-xl border border-[#b7e4c7] bg-[#f3fbf5] p-4"
                    >
                      <BirthdayBadge year={row.year} month={row.month} day={row.day} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] tracking-[0.16em] text-[#1b7a45] uppercase">Verjaardag</p>
                        <h3 className="font-serif text-2xl leading-tight">{row.birthday.name}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {row.key < today.key ? "Werd" : "Wordt"} {row.age} jaar
                        </p>
                      </div>
                    </article>
                  )
                }

                const event = item.event
                const past = new Date(event.startsAt).getTime() < nowMs
                return (
                  <article
                    key={event.id}
                    className={cn("flex gap-4 rounded-xl border border-border bg-card p-4", past && "opacity-70")}
                  >
                    <DateBadge iso={event.startsAt} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-2xl leading-tight">{event.title}</h3>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          {formatTime(new Date(event.startsAt))}
                          {event.endsAt ? ` – ${formatTime(new Date(event.endsAt))}` : ""}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5" />
                          {event.location}
                        </span>
                      </p>
                      <p className="mt-3 text-sm leading-6">{event.description}</p>
                      {event.createdByName ? (
                        <p className="mt-2 text-xs text-muted-foreground">Aangemaakt door {event.createdByName}</p>
                      ) : null}
                      {event.canManage ? (
                        <div className="mt-3 flex gap-1">
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(event)}>
                            Bewerken
                          </Button>
                          <ConfirmDelete
                            action={deleteEvent}
                            id={event.id}
                            title="Evenement verwijderen"
                            description={`“${event.title}” wordt uit de agenda gehaald.`}
                          />
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              })
          )}
        </section>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evenement toevoegen</DialogTitle>
            <DialogDescription>Het evenement komt in de agenda. Jij kunt het daarna aanpassen; beheerders ook.</DialogDescription>
          </DialogHeader>
          {creating ? <EventForm onDone={() => setCreating(false)} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evenement bewerken</DialogTitle>
            <DialogDescription>Pas titel, tijd, locatie of beschrijving aan.</DialogDescription>
          </DialogHeader>
          {editing ? <EventForm event={editing} onDone={() => setEditing(null)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
