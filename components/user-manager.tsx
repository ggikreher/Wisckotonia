"use client"

import Link from "next/link"
import { useActionState, useEffect, useState } from "react"
import { ConfirmDelete } from "@/components/confirm-delete"
import { Field, FormError, FormSuccess } from "@/components/form-feedback"
import { PageHeader } from "@/components/page-header"
import { RoleBadge } from "@/components/role-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createUser, deleteUser, updateUser } from "@/lib/actions/users"
import { formatLongDate } from "@/lib/dates"
import type { UserDTO } from "@/lib/types"

const selectClass = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm"

function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, {})
  const [formKey, setFormKey] = useState(0)
  const [seenNonce, setSeenNonce] = useState<number | undefined>(undefined)

  if (state.nonce && state.nonce !== seenNonce) {
    setSeenNonce(state.nonce)
    setFormKey(state.nonce)
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-serif text-2xl">Nieuw account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Maak een login aan en wijs meteen de rol Dispuutslid of Beheerder toe.
      </p>
      <div className="mt-4 space-y-3">
        <FormSuccess message={state.message} />
        <FormError message={state.error} />
        <form key={formKey} action={action} className="space-y-4">
          <Field label="Naam" htmlFor="name">
            <Input id="name" name="name" autoComplete="name" required />
          </Field>
          <Field label="Gebruikersnaam" htmlFor="username" hint="3–24 tekens: letters, cijfers of _.">
            <Input id="username" name="username" autoComplete="off" required />
          </Field>
          <Field label="E-mail" htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="off" required />
          </Field>
          <Field label="Wachtwoord" htmlFor="password" hint="Minstens 8 tekens.">
            <Input id="password" name="password" type="password" autoComplete="new-password" required />
          </Field>
          <Field label="Rol" htmlFor="role">
            <select id="role" name="role" className={selectClass} defaultValue="DISPUUT">
              <option value="DISPUUT">Dispuutslid</option>
              <option value="ADMIN">Beheerder</option>
            </select>
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Aanmaken…" : "Account aanmaken"}
          </Button>
        </form>
      </div>
    </section>
  )
}

function EditUserDialog({ user, onClose }: { user: UserDTO; onClose: () => void }) {
  const [state, action, pending] = useActionState(updateUser, {})

  useEffect(() => {
    if (state.nonce) onClose()
  }, [state.nonce, onClose])

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account bewerken</DialogTitle>
          <DialogDescription>
            {user.username} · {user.email}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <Field label="Naam" htmlFor={`edit-name-${user.id}`}>
            <Input id={`edit-name-${user.id}`} name="name" defaultValue={user.name} required />
          </Field>
          <Field label="Rol" htmlFor={`edit-role-${user.id}`}>
            <select id={`edit-role-${user.id}`} name="role" className={selectClass} defaultValue={user.role}>
              <option value="DISPUUT">Dispuutslid</option>
              <option value="ADMIN">Beheerder</option>
            </select>
          </Field>
          <Field label="Nieuw wachtwoord" htmlFor={`edit-password-${user.id}`} hint="Laat leeg om het wachtwoord te houden.">
            <Input id={`edit-password-${user.id}`} name="password" type="password" autoComplete="new-password" />
          </Field>
          <FormError message={state.error} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Opslaan…" : "Opslaan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UserManager({ users, currentUserId }: { users: UserDTO[]; currentUserId: string }) {
  const [editing, setEditing] = useState<UserDTO | null>(null)

  return (
    <>
      <PageHeader
        eyebrow="Beheer"
        title="Accounts"
        description="Alleen beheerders komen hier. Leden, evenementen en documenten bewerk je op hun eigen pagina."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Leden", "/leden"],
          ["Agenda", "/agenda"],
          ["Documenten", "/documenten"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm hover:border-brass/50"
          >
            <span className="font-medium">{label} beheren</span>
            <span className="mt-1 block text-muted-foreground">Toevoegen, wijzigen en verwijderen</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <CreateUserForm />
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-serif text-2xl">Bestaande accounts</h2>
          </div>
          <ul className="divide-y divide-border">
            {users.map((user) => (
              <li key={user.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{user.name}</p>
                    <RoleBadge role={user.role} />
                    {user.id === currentUserId ? (
                      <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Jij</span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    @{user.username} · {user.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Aangemaakt op {formatLongDate(new Date(user.createdAt))}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(user)}>
                    Bewerken
                  </Button>
                  {user.id === currentUserId ? null : (
                    <ConfirmDelete
                      action={deleteUser}
                      id={user.id}
                      title="Account verwijderen"
                      description={`${user.name} kan daarna niet meer inloggen.`}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {editing ? <EditUserDialog user={editing} onClose={() => setEditing(null)} /> : null}
    </>
  )
}
