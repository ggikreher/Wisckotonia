"use client"

import { Plus } from "lucide-react"
import { useActionState, useEffect, useState } from "react"
import { Field, FormError, FormSuccess } from "@/components/form-feedback"
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
import { submitDeclaration } from "@/lib/actions/declarations"
import type { ActionState } from "@/lib/types"

type Claim = {
  id: string
  amountCents: number
  reason: string
  bankAccount: string
  accountName: string
  hasImage: boolean
  createdByName: string
  createdAt: string
}

function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100)
}

function formatIban(value: string) {
  return value.replace(/(.{4})/g, "$1 ").trim()
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

function ClaimForm({ onDone }: { onDone: (message: string) => void }) {
  const [state, action, pending] = useActionState(submitDeclaration, {} as ActionState)

  useEffect(() => {
    if (state.nonce && state.message) onDone(state.message)
  }, [state.nonce, state.message, onDone])

  return (
    <form action={action} className="space-y-4">
      <Field label="Bedrag" htmlFor="amount" hint="Bijvoorbeeld 12,50.">
        <Input id="amount" name="amount" inputMode="decimal" placeholder="12,50" required autoFocus />
      </Field>
      <Field label="Reden" htmlFor="reason">
        <Textarea id="reason" name="reason" required maxLength={400} />
      </Field>
      <Field label="Bankrekeningnummer" htmlFor="bankAccount" hint="IBAN, bijvoorbeeld NL00 BANK 0123 4567 89.">
        <Input id="bankAccount" name="bankAccount" autoComplete="off" spellCheck={false} required />
      </Field>
      <Field label="Tenaamstelling" htmlFor="accountName">
        <Input id="accountName" name="accountName" autoComplete="name" required />
      </Field>
      <Field label="Afbeelding" htmlFor="image" hint="Optioneel. JPG, PNG of WebP, maximaal 5 MB.">
        <Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
      </Field>
      <FormError message={state.error} />
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Indienen…" : "Indienen"}
        </Button>
      </div>
    </form>
  )
}

export function DeclarationDesk({ isAdmin, claims }: { isAdmin: boolean; claims: Claim[] }) {
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  return (
    <>
      <PageHeader
        eyebrow="Kas"
        title="Declaratie"
        description="Dien een declaratie in. Een beheerder keert het bedrag uit op het opgegeven rekeningnummer."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <Button type="button" variant="outline" onClick={() => setShowAll((open) => !open)}>
                {showAll ? "Lijst verbergen" : "Alle declaraties"}
              </Button>
            ) : null}
            <Button type="button" onClick={() => setCreating(true)} aria-label="Declaratie indienen">
              <Plus className="size-4" />
            </Button>
          </div>
        }
      />

      {notice ? <FormSuccess message={notice} /> : null}

      {isAdmin && showAll ? (
        claims.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Er zijn nog geen declaraties.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {claims.map((claim) => (
              <li key={claim.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-serif text-2xl">{formatEuro(claim.amountCents)}</p>
                  <p className="text-xs text-muted-foreground">{formatWhen(claim.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm">{claim.reason}</p>
                <p className="mt-3 text-sm text-muted-foreground">{formatIban(claim.bankAccount)}</p>
                <p className="text-sm text-muted-foreground">{claim.accountName}</p>
                <p className="mt-2 text-xs text-muted-foreground">Ingediend door {claim.createdByName}</p>
                {claim.hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/declarations/${claim.id}/image`}
                    alt="Bijlage bij de declaratie"
                    className="mt-3 max-h-64 rounded-lg border border-border object-contain"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declaratie indienen</DialogTitle>
            <DialogDescription>Vul het bedrag, de reden en de rekeninggegevens in.</DialogDescription>
          </DialogHeader>
          {creating ? (
            <ClaimForm
              onDone={(message) => {
                setNotice(message)
                setCreating(false)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
