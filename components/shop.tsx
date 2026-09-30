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
import { deleteShopItem, saveShopItem } from "@/lib/actions/shop"
import type { ShopItemDTO } from "@/lib/types"

function formatEuro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100)
}

function TilePhotos({ item }: { item: ShopItemDTO }) {
  const [index, setIndex] = useState(0)
  const current = item.images[index] ?? item.images[0]

  return (
    <div className="relative aspect-square overflow-hidden bg-secondary">
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/shop/images/${current}?v=${encodeURIComponent(item.updatedAt)}`}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : null}
      {item.images.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-sm text-foreground"
            aria-label="Vorige foto"
            onClick={() => setIndex((value) => (value - 1 + item.images.length) % item.images.length)}
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-sm text-foreground"
            aria-label="Volgende foto"
            onClick={() => setIndex((value) => (value + 1) % item.images.length)}
          >
            ›
          </button>
          <p className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-xs text-foreground">
            {index + 1}/{item.images.length}
          </p>
        </>
      ) : null}
      {item.outOfStock ? (
        <p className="absolute inset-x-3 bottom-3 rounded-md bg-[#8b1e1e] px-2 py-1 text-center text-sm font-medium text-white">
          Out of Stock
        </p>
      ) : null}
    </div>
  )
}

function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",")
}

function ItemForm({ item, onDone }: { item?: ShopItemDTO | null; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveShopItem, {})
  const [outOfStock, setOutOfStock] = useState(item?.outOfStock ?? false)

  useEffect(() => {
    if (state.nonce) onDone()
  }, [state.nonce, onDone])

  return (
    <form action={action} className="space-y-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      {item && item.images.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Huidige afbeeldingen</p>
          <ul className="grid grid-cols-4 gap-2">
            {item.images.map((imageId) => (
              <li key={imageId}>
                <label className="block text-center text-xs text-muted-foreground">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/shop/images/${imageId}?v=${encodeURIComponent(item.updatedAt)}`}
                    alt=""
                    className="aspect-square w-full rounded-md object-cover"
                  />
                  <span className="mt-1 flex items-center justify-center gap-1">
                    <input type="checkbox" name="removeImage" value={imageId} />
                    Weghalen
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Field
        label="Afbeeldingen"
        htmlFor="shop-image"
        hint="Je kunt meerdere foto's kiezen. JPG, PNG of WebP, maximaal 5 MB per foto. Optioneel."
      >
        <Input id="shop-image" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
      </Field>
      <Field label="Omschrijving" htmlFor="shop-description">
        <Textarea id="shop-description" name="description" defaultValue={item?.description} maxLength={400} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Aantal" htmlFor="shop-quantity">
          <Input
            id="shop-quantity"
            name="quantity"
            inputMode="numeric"
            defaultValue={item ? String(item.quantity) : ""}
            required
          />
        </Field>
        <Field label="Kosten" htmlFor="shop-price" hint="Bijvoorbeeld 12,50.">
          <Input
            id="shop-price"
            name="price"
            inputMode="decimal"
            placeholder="12,50"
            defaultValue={item ? centsToInput(item.priceCents) : ""}
            required
          />
        </Field>
      </div>
      <input type="hidden" name="outOfStock" value={outOfStock ? "1" : "0"} />
      {outOfStock ? (
        <p className="rounded-md border border-[#8b1e1e]/30 bg-[#8b1e1e]/10 px-3 py-2 text-sm font-medium text-[#8b1e1e]">
          Out of Stock
        </p>
      ) : null}
      <FormError message={state.error} />
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant={outOfStock ? "default" : "outline"}
          aria-pressed={outOfStock}
          onClick={() => setOutOfStock((value) => !value)}
        >
          Out of Stock
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Annuleren
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Opslaan…" : "Opslaan"}
          </Button>
        </div>
      </div>
    </form>
  )
}

function ItemDialog({
  open,
  item,
  onOpenChange,
}: {
  open: boolean
  item?: ShopItemDTO | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Tegel bewerken" : "Tegel plaatsen"}</DialogTitle>
          <DialogDescription>De tegel komt in De Wisko Winkel. Iedereen die is ingelogd kan hem zien.</DialogDescription>
        </DialogHeader>
        {open ? <ItemForm item={item} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

export function Shop({ items, isAdmin }: { items: ShopItemDTO[]; isAdmin: boolean }) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ShopItemDTO | null>(null)

  return (
    <>
      <PageHeader
        eyebrow="Winkel"
        title="De Wisko Winkel"
        description="Voor interesse in een item, neem contact op met Sjon"
        action={
          isAdmin ? (
            <Button type="button" onClick={() => setCreating(true)}>
              Tegel plaatsen
            </Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="Nog geen tegels"
          text={isAdmin ? "Plaats de eerste tegel om de winkel te vullen." : "De winkel is nog leeg."}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <TilePhotos item={item} />
              <div className="space-y-2 p-3">
                <p className="text-sm leading-6">{item.description}</p>
                {item.outOfStock ? <p className="text-sm font-medium text-[#8b1e1e]">Out of Stock</p> : null}
                <p className="text-sm text-muted-foreground">Aantal {item.quantity}</p>
                <p className="font-serif text-xl">{formatEuro(item.priceCents)}</p>
                {isAdmin ? (
                  <div className="flex items-center gap-1 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditing(item)}>
                      Bewerken
                    </Button>
                    <ConfirmDelete
                      action={deleteShopItem}
                      id={item.id}
                      title="Tegel verwijderen"
                      description="Deze tegel verdwijnt uit De Wisko Winkel."
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ItemDialog open={creating} onOpenChange={setCreating} />
      <ItemDialog
        open={editing !== null}
        item={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      />
    </>
  )
}
