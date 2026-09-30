"use client"

import { useActionState, useEffect, useState } from "react"
import { Field, FormError } from "@/components/form-feedback"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { saveSponsorLink } from "@/lib/actions/sponsor"
import type { Role } from "@/lib/types"

const CAPTION = "Powered bij THBI"

export function SponsorBadge({
  role,
  url,
  hasImage,
  updatedAt,
}: {
  role: Role
  url: string
  hasImage: boolean
  updatedAt: string | null
}) {
  const isAdmin = role === "ADMIN"
  const [open, setOpen] = useState(false)

  if (!isAdmin && (!hasImage || !url)) return null

  const image = hasImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/sponsor/image?v=${encodeURIComponent(updatedAt ?? "")}`}
      alt=""
      className="size-14 rounded-md object-cover"
    />
  ) : (
    <span className="flex size-14 items-center justify-center rounded-md border border-dashed border-white/30 text-[10px] text-white/70">
      +
    </span>
  )

  const caption = <span className="mt-1 block text-center text-[9px] leading-tight text-white/70">{CAPTION}</span>

  return (
    <div className="shrink-0">
      {isAdmin ? (
        <button type="button" onClick={() => setOpen(true)} className="block w-14 text-left" aria-label="Afbeelding plaatsen">
          {image}
          {caption}
        </button>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block w-14">
          {image}
          {caption}
        </a>
      )}
      {isAdmin ? <SponsorDialog open={open} url={url} onOpenChange={setOpen} /> : null}
    </div>
  )
}

function SponsorDialog({
  open,
  url,
  onOpenChange,
}: {
  open: boolean
  url: string
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Afbeelding plaatsen</DialogTitle>
          <DialogDescription>
            De afbeelding staat rechtsonder in het menu. Leden die erop klikken gaan naar de link.
          </DialogDescription>
        </DialogHeader>
        {open ? <SponsorForm url={url} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function SponsorForm({ url, onDone }: { url: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveSponsorLink, {})

  useEffect(() => {
    if (state.nonce) onDone()
  }, [state.nonce, onDone])

  return (
    <form action={action} className="space-y-4">
      <Field label="Afbeelding" htmlFor="sponsor-image" hint="JPG, PNG of WebP, maximaal 5 MB.">
        <Input id="sponsor-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
      </Field>
      <Field label="Link" htmlFor="sponsor-url" hint="Leden openen deze site als ze op de afbeelding drukken.">
        <Input id="sponsor-url" name="url" type="url" defaultValue={url} placeholder="https://" required />
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
