"use client"

import { ArrowLeft } from "lucide-react"
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
import { deleteAlbum, deletePhoto, renameAlbum, uploadPhotos } from "@/lib/actions/photos"
import type { PhotoDTO } from "@/lib/types"

function RenameForm({ id, name, onDone }: { id: string; name: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(renameAlbum, {})

  useEffect(() => {
    if (state.nonce) onDone()
  }, [state.nonce, onDone])

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <Field label="Naam" htmlFor="rename-album">
        <Input id="rename-album" name="name" defaultValue={name} required autoFocus />
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

function UploadForm({ albumId, onDone }: { albumId: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(uploadPhotos, {})

  useEffect(() => {
    if (state.nonce) onDone()
  }, [state.nonce, onDone])

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="albumId" value={albumId} />
      <Field label="Foto's" htmlFor="photos" hint="JPG, PNG of WebP. Meerdere tegelijk mag. Elke foto maximaal 5 MB.">
        <Input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
      </Field>
      <FormError message={state.error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Annuleren
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Uploaden…" : "Uploaden"}
        </Button>
      </div>
    </form>
  )
}

export function PhotoAlbumView({
  album,
}: {
  album: {
    id: string
    name: string
    createdByName: string | null
    canManage: boolean
    photos: PhotoDTO[]
  }
}) {
  const [uploading, setUploading] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = album.photos.find((photo) => photo.id === selectedId) ?? null

  return (
    <>
      <Link href="/fotos" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Alle mapjes
      </Link>

      <PageHeader
        eyebrow="Foto's"
        title={album.name}
        description={
          album.createdByName
            ? `Aangemaakt door ${album.createdByName}. Iedereen kan foto's toevoegen. Een foto verwijderen kan degene die hem heeft geüpload, of een beheerder.`
            : "Iedereen kan foto's toevoegen. Een foto verwijderen kan degene die hem heeft geüpload, of een beheerder."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => setUploading(true)}>
              Foto's toevoegen
            </Button>
            {album.canManage ? (
              <>
                <Button type="button" variant="outline" onClick={() => setRenaming(true)}>
                  Hernoemen
                </Button>
                <ConfirmDelete
                  action={deleteAlbum}
                  id={album.id}
                  title="Map verwijderen"
                  description={`“${album.name}” en de foto's erin worden verwijderd.`}
                  label="Map verwijderen"
                />
              </>
            ) : null}
          </div>
        }
      />

      {album.photos.length === 0 ? (
        <EmptyState title="Nog geen foto's" text="Voeg de eerste foto's aan deze map toe." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {album.photos.map((photo) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setSelectedId(photo.id)}
                className="block aspect-square w-full overflow-hidden rounded-xl border border-border bg-secondary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/photos/${photo.id}`} alt={`Foto in ${album.name}`} className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={uploading} onOpenChange={setUploading}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foto's toevoegen</DialogTitle>
            <DialogDescription>De foto's komen in “{album.name}”.</DialogDescription>
          </DialogHeader>
          {uploading ? <UploadForm albumId={album.id} onDone={() => setUploading(false)} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map hernoemen</DialogTitle>
            <DialogDescription>De foto's in deze map blijven staan.</DialogDescription>
          </DialogHeader>
          {renaming ? <RenameForm id={album.id} name={album.name} onDone={() => setRenaming(false)} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelectedId(null) }}>
        <DialogContent className="max-w-3xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Foto</DialogTitle>
                <DialogDescription>
                  {selected.createdByName ? `Toegevoegd door ${selected.createdByName}.` : "Foto in deze map."}
                </DialogDescription>
              </DialogHeader>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/photos/${selected.id}`}
                alt={`Foto in ${album.name}`}
                className="max-h-[65vh] w-full rounded-lg object-contain bg-secondary"
              />
              {selected.canDelete ? (
                <div className="flex justify-end">
                  <ConfirmDelete
                    action={deletePhoto}
                    id={selected.id}
                    title="Foto verwijderen"
                    description="Deze foto verdwijnt uit de map."
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
