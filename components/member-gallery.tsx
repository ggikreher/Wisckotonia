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
import { BOARD_ROLES, MEMBER_CATEGORIES, boardRoleLabel, memberCategoryLabel } from "@/lib/constants"
import type { MemberDTO } from "@/lib/types"

const PALETTE = ["#000080", "#1c3b34", "#3c4d6e", "#6a4528", "#4c3348", "#2d4a3a"]

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
  const [failed, setFailed] = useState(false)

  if (member.hasPhoto && !failed) {
    return (
      // De foto komt via een beveiligde route; de image-optimizer stuurt geen sessiecookie mee.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/members/${member.id}/photo?v=${encodeURIComponent(member.updatedAt)}`}
        alt={`Profielfoto van ${member.name}`}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
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
      <Field label="Titel of functie" htmlFor="title" hint="Optioneel.">
        <Input id="title" name="title" defaultValue={member?.title} />
      </Field>
      <Field label="Categorie" htmlFor="category" hint="Elk lid hoort bij één categorie.">
        <select
          id="category"
          name="category"
          defaultValue={member?.category ?? ""}
          required
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="" disabled>
            Kies een categorie
          </option>
          {MEMBER_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {memberCategoryLabel(category)}
            </option>
          ))}
        </select>
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
      <Field label="Geboortedatum" htmlFor="birthDate" hint="Bijvoorbeeld 29/09/2000. Optioneel.">
        <Input
          id="birthDate"
          name="birthDate"
          type="text"
          autoComplete="bday"
          spellCheck={false}
          maxLength={10}
          placeholder="29/09/2000"
          defaultValue={member?.birthDate ?? ""}
        />
      </Field>
      <Field label="Lid sinds" htmlFor="memberSince" hint="Bijvoorbeeld 29/09/2019. Optioneel.">
        <Input
          id="memberSince"
          name="memberSince"
          type="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={10}
          placeholder="29/09/2019"
          defaultValue={member?.memberSince ?? ""}
        />
      </Field>
      <Field label="Korte tekst" htmlFor="bio" hint="Optioneel.">
        <Textarea id="bio" name="bio" defaultValue={member?.bio} maxLength={400} />
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
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {members.map((member) => (
            <li key={member.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-square overflow-hidden bg-secondary">
                <Portrait member={member} />
              </div>
              <div className="space-y-2 p-3">
                <div>
                  <h2 className="font-serif text-xl leading-tight">{member.name}</h2>
                  {member.category ? (
                    <p className="mt-1 text-sm text-primary">{memberCategoryLabel(member.category)}</p>
                  ) : null}
                  {member.boardRole ? (
                    <p className="mt-1 text-[11px] tracking-[0.16em] text-brass uppercase">
                      {boardRoleLabel(member.boardRole)}
                    </p>
                  ) : member.title ? (
                    <p className="mt-1 text-[11px] tracking-[0.16em] text-brass uppercase">{member.title}</p>
                  ) : null}
                  {member.boardRole && member.title ? (
                    <p className="mt-1 text-sm text-muted-foreground">{member.title}</p>
                  ) : null}
                  {member.birthDate ? (
                    <p className="mt-1 text-sm text-muted-foreground">Geboren {member.birthDate}</p>
                  ) : null}
                  {member.memberSince ? (
                    <p className="mt-1 text-sm text-muted-foreground">Lid sinds {member.memberSince}</p>
                  ) : null}
                </div>
                {member.bio ? <p className="text-sm leading-6 text-muted-foreground">{member.bio}</p> : null}
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
