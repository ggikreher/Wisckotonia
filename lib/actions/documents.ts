"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { DOCUMENT_CATEGORIES } from "@/lib/constants"
import { inspectDocument, removeStoredFile, storeUpload } from "@/lib/files"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/types"
import { documentSchema, issueMessage } from "@/lib/validators"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

function done(message: string): ActionState {
  return { message, nonce: Date.now() }
}

function resolveCategory(formData: FormData) {
  const preset = String(formData.get("category") ?? "").trim()
  const custom = String(formData.get("categoryCustom") ?? "").trim()
  if (preset === "Anders") return custom
  if ((DOCUMENT_CATEGORIES as readonly string[]).includes(preset)) return preset
  return custom || preset
}

export async function uploadDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Alleen beheerders kunnen documenten uploaden." }

  const parsed = documentSchema.safeParse({
    title: formData.get("title"),
    category: resolveCategory(formData),
  })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  const file = formData.get("file")
  if (!(file instanceof File)) return { error: "Kies een bestand om te uploaden." }

  const inspected = inspectDocument(file)
  if (inspected.error || !inspected.extension || !inspected.mimeType) {
    return { error: inspected.error ?? "Het bestand is ongeldig." }
  }

  const stored = await storeUpload(file, "documents", inspected.extension)

  try {
    await prisma.document.create({
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        fileName: file.name || `document${inspected.extension}`,
        storagePath: stored.storagePath,
        mimeType: inspected.mimeType,
        sizeBytes: stored.sizeBytes,
      },
    })
  } catch (error) {
    await removeStoredFile(stored.storagePath)
    throw error
  }

  revalidatePath("/documenten")
  revalidatePath("/")
  return done("Document geüpload.")
}

export async function deleteDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Alleen beheerders kunnen documenten verwijderen." }

  const id = String(formData.get("id") ?? "")
  const existing = await prisma.document.findUnique({ where: { id } })
  if (!existing) return { error: "Dit document bestaat niet meer." }

  await prisma.document.delete({ where: { id } })
  await removeStoredFile(existing.storagePath)
  revalidatePath("/documenten")
  revalidatePath("/")
  return done("Document verwijderd.")
}
