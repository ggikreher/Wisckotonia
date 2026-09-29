"use client"

import { useActionState, useEffect, useState } from "react"
import { ConfirmDelete } from "@/components/confirm-delete"
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
import { deleteMember, saveMember } from "@/lib/actions/members"
import { BOARD_ROLES, boardRoleLabel } from "@/lib/constants"
import type { MemberDTO } from "@/lib/types"

const PALETTE = ["#6e2433", "#1c3b34", "#3c4d6e", "#6a4528", "#4c3348", "#2d4a3a"]

function colorFor(name: string) {
  let hash = 0
  for (const char of name) hash = (hash + char.charCodeAt(0) * 13) % PALETTE.length
  return PALETTE[hash] ?? PALETTE[0]
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function Portrait({ member }: { member: MemberDTO }) {
  if (member.hasPhoto) {
    return (
      // De foto komt via een beveiligde route; de image-optimizer stuurt geen sessiecookie mee.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/members/${member.id}/photo`}
        alt={`Profielfoto van ${member.name}`}
        className="h-full w-full object-cover"
      />
    )
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: colorFor(member.name) }}
    >
      <span className="font-serif text-5xl text-[#f6f1e8]">{initials(member.name)}</span>
    </div>
  )
}

function MemberForm({ member, onDone }: { member?: MemberDTO | null; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveMember, {})
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (state.nonce) onDone()
  }, [state.nonce, onDone])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  return (
    <form action={action} className="space-y-4">
      {member ? <input type="hidden" name="id" value={member.id} /> : null}
      <div className="flex items-center gap-4">
        <div className="size-20 overflow-hidden rounded-lg border border-border">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : member ? (
            <Portrait member={member} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary font-serif text-xl text-muted-foreground">
              W
            </div>
          )}
        </div>
        <Field label="Profielfoto" htmlFor="photo" hint="JPG, PNG of WebP, maximaal 5 MB. Optioneel.">
          <Input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0]
              setPreview(file ? URL.createObjectURL(file) : null)
            }}
          />
        </Field>
      </div>
      <Field label="Naam" htmlFor="name">
        <Input id="name" name="name" defaultValue={member?.name} required />
      </Field>
      <Field label="Titel of functie" htmlFor="title">
        <Input id="title" name="title" defaultValue={member?.title} required />
      </Field>
      <Field
        label="Bestuursrol"
        htmlFor="boardRole"
        hint="Voorzitter, penningmeester of secretaris. Elke rol kan maar één persoon hebben."
      >
        <select
          id="boardRole"
          name="boardRole"
          defaultValue={member?.boardRole ?? ""}
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Geen bestuursrol</option>
          {BOARD_ROLES.map((role) => (
            <option key={role} value={role}>
              {boardRoleLabel(role)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Lid sinds" htmlFor="memberSince" hint="Jaartal, bijvoorbeeld 2019. Optioneel.">
        <Input
          id="memberSince"
          name="memberSince"
          inputMode="numeric"
          maxLength={4}
          placeholder="2019"
          defaultValue={member?.memberSince ?? ""}
        />
      </Field>
      <Field label="Korte tekst" htmlFor="bio">
        <Textarea id="bio" name="bio" defaultValue={member?.bio} maxLength={400} required />
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

function MemberDialog({
  open,
  member,
  onOpenChange,
}: {
  open: boolean
  member?: MemberDTO | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "Lid bewerken" : "Lid toevoegen"}</DialogTitle>
          <DialogDescription>
            Dit is de kaart in de galerij. Een inlogaccount maak je apart aan onder Beheer.
          </DialogDescription>
        </DialogHeader>
        {open ? <MemberForm member={member} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

export function MemberGallery({ members, isAdmin }: { members: MemberDTO[]; isAdmin: boolean }) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<MemberDTO | null>(null)

  return (
    <>
      <PageHeader
        eyebrow="Dispuut"
        title="Leden"
        description="De galerij van dispuutsgenoten. Iedereen die is ingelogd kan deze bekijken."
        action={
          isAdmin ? (
            <Button type="button" onClick={() => setCreating(true)}>
              Lid toevoegen
            </Button>
          ) : null
        }
      />

      {members.length === 0 ? (
        <EmptyState
          title="Nog geen leden"
          text={isAdmin ? "Voeg het eerste lid toe om de galerij te vullen." : "De galerij is nog leeg."}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <li key={member.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-[4/5] overflow-hidden bg-secondary">
                <Portrait member={member} />
              </div>
              <div className="space-y-2 p-4">
                <div>
                  <h2 className="font-serif text-2xl leading-tight">{member.name}</h2>
                  <p className="mt-1 text-[11px] tracking-[0.16em] text-brass uppercase">
                    {member.boardRole ? boardRoleLabel(member.boardRole) : member.title}
                  </p>
                  {member.boardRole ? <p className="mt-1 text-sm text-muted-foreground">{member.title}</p> : null}
                  {member.memberSince ? (
                    <p className="mt-1 text-sm text-muted-foreground">Lid sinds {member.memberSince}</p>
                  ) : null}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{member.bio}</p>
                {isAdmin ? (
                  <div className="flex items-center gap-1 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditing(member)}>
                      Bewerken
                    </Button>
                    <ConfirmDelete
                      action={deleteMember}
                      id={member.id}
                      title="Lid verwijderen"
                      description={`${member.name} verdwijnt uit de galerij. Het inlogaccount, als dat bestaat, blijft bestaan.`}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <MemberDialog open={creating} onOpenChange={setCreating} />
      <MemberDialog
        open={editing !== null}
        member={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      />
    </>
  )
}
