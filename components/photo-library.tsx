"use client"

import { Folder, Search } from "lucide-react"
import Link from "next/link"
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
import { createAlbum, deleteAlbum, renameAlbum } from "@/lib/actions/photos"
import type { AlbumDTO } from "@/lib/types"

function photoLabel(count: number) {
  return count === 1 ? "1 foto" : `${count} foto's`
}

function AlbumNameForm({
  album,
  onDone,
}: {
  album?: AlbumDTO | null
  onDone: () => void
}) {
  const action = album ? renameAlbum : createAlbum
  const [state, formAction, pending] = useActionState(action, {})

  useEffect(() => {
    if (state.nonce) onDone()
  }, [state.nonce, onDone])

  return (
    <form action={formAction} className="space-y-4">
      {album ? <input type="hidden" name="id" value={album.id} /> : null}
      <Field label="Naam" htmlFor="album-name">
        <Input id="album-name" name="name" defaultValue={album?.name} required autoFocus />
      </Field>
      <Field label="Datum" htmlFor="album-date" hint="Bijvoorbeeld 29/09/2026. Optioneel. De mapjes staan op deze datum.">
        <Input
          id="album-date"
          name="eventDate"
          type="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={10}
          placeholder="29/09/2026"
          defaultValue={album?.eventDate ?? ""}
        />
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

function AlbumDialog({
  open,
  album,
  onOpenChange,
}: {
  open: boolean
  album?: AlbumDTO | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{album ? "Map bewerken" : "Map maken"}</DialogTitle>
          <DialogDescription>
            {album
              ? "Pas de naam en de datum aan. De foto's blijven staan."
              : "Daarna kun je foto's in de map zetten. Andere leden kunnen dat ook."}
          </DialogDescription>
        </DialogHeader>
        {open ? <AlbumNameForm album={album} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

export function PhotoLibrary({ albums }: { albums: AlbumDTO[] }) {
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<AlbumDTO | null>(null)
  const [query, setQuery] = useState("")
  const needle = query.trim().toLocaleLowerCase("nl")
  const visible = needle
    ? albums.filter((album) => {
        const name = album.name.toLocaleLowerCase("nl")
        const creator = album.createdByName?.toLocaleLowerCase("nl") ?? ""
        const date = album.eventDate?.toLocaleLowerCase("nl") ?? ""
        return name.includes(needle) || creator.includes(needle) || date.includes(needle)
      })
    : albums

  return (
    <>
      <PageHeader
        eyebrow="Archief"
        title="Foto's"
        description="Maak mapjes voor borrels, weekenden en andere momenten. Iedereen kan een map maken en foto's toevoegen. Verwijderen kan de maker, of een beheerder."
        action={
          <Button type="button" onClick={() => setCreating(true)}>
            Map maken
          </Button>
        }
      />

      {albums.length === 0 ? (
        <EmptyState title="Nog geen mapjes" text="Maak een eerste map, bijvoorbeeld voor een borrel of een weekend." />
      ) : (
        <>
          <div className="relative mb-5 max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek een map of maker"
              aria-label="Zoek een map of maker"
              className="pl-9"
            />
          </div>
          {visible.length === 0 ? (
            <EmptyState title="Geen mapjes gevonden" text={`Geen mapjes voor “${query.trim()}”.`} />
          ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {visible.map((album) => (
            <li key={album.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <Link href={`/fotos/${album.id}`} className="block">
                <div className="flex aspect-video items-center justify-center overflow-hidden bg-secondary">
                  {album.coverPhotoId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/photos/${album.coverPhotoId}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Folder className="size-10 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1 px-3 pt-3">
                  <h2 className="font-serif text-xl leading-tight">{album.name}</h2>
                  {album.eventDate ? <p className="text-sm text-primary">{album.eventDate}</p> : null}
                  <p className="text-sm text-muted-foreground">{photoLabel(album.photoCount)}</p>
                  {album.createdByName ? (
                    <p className="text-xs text-muted-foreground">Aangemaakt door {album.createdByName}</p>
                  ) : null}
                </div>
              </Link>
              {album.canManage ? (
                <div className="flex items-center gap-1 px-3 py-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setRenaming(album)}>
                    Bewerken
                  </Button>
                  <ConfirmDelete
                    action={deleteAlbum}
                    id={album.id}
                    title="Map verwijderen"
                    description={`“${album.name}” en de foto's erin worden verwijderd.`}
                  />
                </div>
              ) : (
                <div className="h-4" />
              )}
            </li>
          ))}
        </ul>
          )}
        </>
      )}

      <AlbumDialog open={creating} onOpenChange={setCreating} />
      <AlbumDialog
        open={renaming !== null}
        album={renaming}
        onOpenChange={(open) => {
          if (!open) setRenaming(null)
        }}
      />
    </>
  )
}
