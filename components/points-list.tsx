"use client"

import { Search } from "lucide-react"
import { useState } from "react"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { savePointsChoice } from "@/lib/actions/points"
import { POINTS_CHOICES, boardRoleLabel, pointsChoiceLabel } from "@/lib/constants"
import type { BoardRole, PointsChoice } from "@/lib/types"

export type PointsMember = {
  id: string
  name: string
  title: string
  boardRole: BoardRole | null
  pointsChoice: PointsChoice | null
  pointsFollowUp: string
}

function PointsRow({ member }: { member: PointsMember }) {
  const [choice, setChoice] = useState(member.pointsChoice ?? "")
  const [followUp, setFollowUp] = useState(member.pointsFollowUp)
  const [savedChoice, setSavedChoice] = useState(member.pointsChoice ?? "")
  const [savedFollowUp, setSavedFollowUp] = useState(member.pointsFollowUp)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [error, setError] = useState("")
  const label = member.boardRole ? boardRoleLabel(member.boardRole) : member.title

  async function persist(nextChoice: string, nextFollowUp: string) {
    const followUpValue = nextChoice === "WHISKY_ARTIKEL" ? nextFollowUp.trim() : ""
    if (nextChoice === savedChoice && followUpValue === savedFollowUp) {
      setStatus("idle")
      setError("")
      return
    }
    setStatus("saving")
    setError("")
    const result = await savePointsChoice(member.id, nextChoice, followUpValue)
    if (result.error) {
      setStatus("error")
      setError(result.error)
      return
    }
    setSavedChoice(nextChoice)
    setSavedFollowUp(followUpValue)
    setFollowUp(followUpValue)
    setStatus("saved")
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 sm:w-56 sm:shrink-0">
        <p className="truncate font-serif text-lg leading-tight">{member.name}</p>
        {label ? (
          <p className="mt-1 truncate text-[11px] tracking-[0.16em] text-brass uppercase">{label}</p>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <select
          value={choice}
          onChange={(event) => {
            const next = event.target.value
            setChoice(next)
            const nextFollowUp = next === "WHISKY_ARTIKEL" ? followUp : ""
            if (next !== "WHISKY_ARTIKEL") setFollowUp("")
            void persist(next, nextFollowUp)
          }}
          aria-label={`Keuze voor ${member.name}`}
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Kies een optie</option>
          {POINTS_CHOICES.map((option) => (
            <option key={option} value={option}>
              {pointsChoiceLabel(option)}
            </option>
          ))}
        </select>
        {choice === "WHISKY_ARTIKEL" ? (
          <Input
            value={followUp}
            onChange={(event) => {
              setFollowUp(event.target.value)
              setStatus("idle")
            }}
            onBlur={() => persist(choice, followUp)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
            placeholder="Vervolgvraag"
            aria-label={`Vervolgvraag voor ${member.name}`}
            maxLength={500}
          />
        ) : null}
        {status === "saving" ? <p className="text-xs text-muted-foreground">Opslaan…</p> : null}
        {status === "saved" ? <p className="text-xs text-muted-foreground">Opgeslagen</p> : null}
        {status === "error" ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </li>
  )
}

export function PointsList({ members }: { members: PointsMember[] }) {
  const [query, setQuery] = useState("")
  const needle = query.trim().toLocaleLowerCase("nl")
  const visible = needle
    ? members.filter((member) => {
        const name = member.name.toLocaleLowerCase("nl")
        const title = member.title.toLocaleLowerCase("nl")
        const role = member.boardRole ? boardRoleLabel(member.boardRole).toLocaleLowerCase("nl") : ""
        const choice = member.pointsChoice ? pointsChoiceLabel(member.pointsChoice).toLocaleLowerCase("nl") : ""
        const followUp = member.pointsFollowUp.toLocaleLowerCase("nl")
        return (
          name.includes(needle) ||
          title.includes(needle) ||
          role.includes(needle) ||
          choice.includes(needle) ||
          followUp.includes(needle)
        )
      })
    : members

  return (
    <>
      <PageHeader
        eyebrow="Dispuut"
        title="Punten sparen"
        description="Kies per lid waar de punten naartoe gaan. De keuze wordt meteen opgeslagen."
      />
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">Er staan nog geen leden in de galerij.</p>
      ) : (
        <>
          <div className="relative mb-5 max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek een lid of keuze"
              aria-label="Zoek een lid of keuze"
              className="pl-9"
            />
          </div>
          {visible.length === 0 ? (
            <EmptyState title="Geen leden gevonden" text={`Geen leden voor “${query.trim()}”.`} />
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((member) => (
                <PointsRow key={member.id} member={member} />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
