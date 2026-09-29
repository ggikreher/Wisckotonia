"use client"

import { Download, FileText } from "lucide-react"
import { useActionState, useEffect, useMemo, useState } from "react"
import { ConfirmDelete } from "@/components/confirm-delete"
import { EmptyState } from "@/components/empty-state"
import { Field, FormError } from "@/components/form-feedback"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { deleteDocument, uploadDocument } from "@/lib/actions/documents"
import { DOCUMENT_CATEGORIES, formatBytes } from "@/lib/constants"
import { formatLongDate } from "@/lib/dates"
import type { DocumentDTO } from "@/lib/types"
import { cn } from "@/lib/utils"

function UploadForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState(uploadDocument, {})
  const [custom, setCustom] = useState(false)

  useEffect(() => {
    if (state.nonce) onDone()
  }, [state.nonce, onDone])

  return (
    <form action={action} className="space-y-4">
      <Field label="Titel" htmlFor="title">
        <Input id="title" name="title" required />
      </Field>
      <Field label="Categorie" htmlFor="category">
        <select
          id="category"
          name="category"
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          defaultValue={DOCUMENT_CATEGORIES[0]}
          onChange={(event) => setCustom(event.target.value === "Anders")}
        >
          {DOCUMENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          <option value="Anders">Anders…</option>
        </select>
      </Field>
      {custom ? (
        <Field label="Eigen categorie" htmlFor="categoryCustom">
          <Input id="categoryCustom" name="categoryCustom" required />
        </Field>
      ) : null}
      <Field label="Bestand" htmlFor="file" hint="PDF, Office, tekst of afbeelding. Maximaal 10 MB.">
        <Input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp"
          required
        />
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

export function DocumentLibrary({ documents, isAdmin }: { documents: DocumentDTO[]; isAdmin: boolean }) {
  const [filter, setFilter] = useState("Alles")
  const [uploading, setUploading] = useState(false)

  const categories = useMemo(() => {
    const present = new Set(documents.map((document) => document.category))
    const ordered = [
      ...DOCUMENT_CATEGORIES.filter((category) => present.has(category)),
      ...[...present].filter((category) => !(DOCUMENT_CATEGORIES as readonly string[]).includes(category)).sort(),
    ]
    return ["Alles", ...ordered]
  }, [documents])

  const visible = filter === "Alles" ? documents : documents.filter((document) => document.category === filter)

  return (
    <>
      <PageHeader
        eyebrow="Archief"
        title="Documenten"
        description="Statuten, reglementen, jaarverslagen en andere stukken van het dispuut."
        action={
          isAdmin ? (
            <Button type="button" onClick={() => setUploading(true)}>
              Document uploaden
            </Button>
          ) : null
        }
      />

      {documents.length > 0 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                filter === category
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary",
              )}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title="Geen documenten"
          text={
            isAdmin
              ? "Upload het eerste document, bijvoorbeeld de statuten of een jaarverslag."
              : "Er staan nog geen documenten in deze categorie."
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {visible.map((document) => (
            <li key={document.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-medium">{document.title}</h2>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{document.fileName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge>{document.category}</Badge>
                    <span>{formatLongDate(new Date(document.createdAt))}</span>
                    <span>{formatBytes(document.sizeBytes)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/documents/${document.id}`} target="_blank" rel="noreferrer">
                    Openen
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/documents/${document.id}?dl=1`}>
                    <Download className="size-3.5" />
                    Downloaden
                  </a>
                </Button>
                {isAdmin ? (
                  <ConfirmDelete
                    action={deleteDocument}
                    id={document.id}
                    title="Document verwijderen"
                    description={`“${document.title}” wordt definitief verwijderd.`}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={uploading} onOpenChange={setUploading}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document uploaden</DialogTitle>
            <DialogDescription>Het bestand is daarna zichtbaar voor alle ingelogde leden.</DialogDescription>
          </DialogHeader>
          {uploading ? <UploadForm onDone={() => setUploading(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
