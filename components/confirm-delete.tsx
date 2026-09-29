"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormError } from "@/components/form-feedback"
import type { ActionState } from "@/lib/types"
import { useActionState } from "react"

export function ConfirmDelete({
  action,
  id,
  title,
  description,
  label = "Verwijderen",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  id: string
  title: string
  description: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(action, {})
  const [seenNonce, setSeenNonce] = useState<number | undefined>(undefined)

  if (state.nonce && state.nonce !== seenNonce) {
    setSeenNonce(state.nonce)
    setOpen(false)
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <FormError message={state.error} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Verwijderen…" : "Verwijderen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
