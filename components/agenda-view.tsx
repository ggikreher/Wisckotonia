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
import { amsterdamParts, formatMonthLabel, formatTime, formatTypedDateTime } from "@/lib/dates"
import type { EventDTO } from "@/lib/types"
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

export function AgendaView({ events, now }: { events: EventDTO[]; now: string }) {
  const nowMs = new Date(now).getTime()
  const today = amsterdamParts(new Date(now))
  const [cursor, setCursor] = useState({ year: today.year, month: today.month })
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<EventDTO | null>(null)

  const keysWithEvents = useMemo(() => {
    const keys = new Set<string>()
    for (const event of events) keys.add(amsterdamParts(new Date(event.startsAt)).key)
    return keys
  }, [events])

  const visible = events.filter((event) => {
    const key = amsterdamParts(new Date(event.startsAt)).key
    if (selectedKey) return key === selectedKey
    const [year, month] = key.split("-").map(Number)
    return year === cursor.year && month === cursor.month
  })

  const nextEvent = events.find((event) => new Date(event.startsAt).getTime() >= nowMs)
  const cells = monthCells(cursor.year, cursor.month)

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

      {nextEvent ? (
        <button
          type="button"
          onClick={() => openDay(amsterdamParts(new Date(nextEvent.startsAt)).key)}
          className="mb-6 flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-brass/50"
        >
          <span>
            <span className="block text-[11px] tracking-[0.16em] text-brass uppercase">Eerstvolgende</span>
            <span className="mt-1 block font-serif text-xl">{nextEvent.title}</span>
          </span>
          <span className="text-sm text-muted-foreground">{formatTime(new Date(nextEvent.startsAt))}</span>
        </button>
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
              const isToday = cell.key === today.key
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => openDay(cell.key)}
                  aria-pressed={selected}
                  aria-label={cell.key}
                  className={cn(
                    "relative flex h-10 items-center justify-center rounded-md text-sm",
                    hasEvent || selected
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
          {visible.length === 0 ? (
            <EmptyState
              title="Geen evenementen"
              text={selectedKey ? "Op deze dag staat niets gepland." : "In deze maand staat niets gepland."}
            />
          ) : (
            visible.map((event) => {
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
