"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { inspectImage, removeStoredFile, storeUpload } from "@/lib/files"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/types"
import { albumSchema, issueMessage } from "@/lib/validators"

async function requireUser() {
  const session = await auth()
  if (!session?.user) return null
  return session.user
}

function canManage(user: { id: string; role: string }, createdById: string | null) {
  return user.role === "ADMIN" || createdById === user.id
}

function done(message: string): ActionState {
  return { message, nonce: Date.now() }
}

function refresh(albumId?: string) {
  revalidatePath("/fotos")
  revalidatePath("/")
  if (albumId) revalidatePath(`/fotos/${albumId}`)
}

export async function createAlbum(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  if (!user) return { error: "Log in om een map te maken." }

  const parsed = albumSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  await prisma.photoAlbum.create({
    data: { name: parsed.data.name, createdById: user.id },
  })
  refresh()
  return done("Map gemaakt.")
}

export async function renameAlbum(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  if (!user) return { error: "Log in om een map te hernoemen." }

  const id = String(formData.get("id") ?? "")
  const existing = await prisma.photoAlbum.findUnique({ where: { id } })
  if (!existing) return { error: "Deze map bestaat niet meer." }
  if (!canManage(user, existing.createdById)) {
    return { error: "Je kunt alleen je eigen mapjes hernoemen." }
  }

  const parsed = albumSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  await prisma.photoAlbum.update({ where: { id }, data: { name: parsed.data.name } })
  refresh(id)
  return done("Map hernoemd.")
}

export async function deleteAlbum(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  if (!user) return { error: "Log in om een map te verwijderen." }

  const id = String(formData.get("id") ?? "")
  const existing = await prisma.photoAlbum.findUnique({
    where: { id },
    include: { photos: { select: { storagePath: true } } },
  })
  if (!existing) return { error: "Deze map bestaat niet meer." }
  if (!canManage(user, existing.createdById)) {
    return { error: "Je kunt alleen je eigen mapjes verwijderen." }
  }

  await prisma.photoAlbum.delete({ where: { id } })
  await Promise.all(existing.photos.map((photo) => removeStoredFile(photo.storagePath)))
  refresh(id)
  redirect("/fotos")
}

export async function uploadPhotos(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  if (!user) return { error: "Log in om foto's toe te voegen." }

  const albumId = String(formData.get("albumId") ?? "")
  const album = await prisma.photoAlbum.findUnique({ where: { id: albumId } })
  if (!album) return { error: "Deze map bestaat niet meer." }

  const files = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File && item.size > 0)
  if (files.length === 0) return { error: "Kies minstens één foto." }
  if (files.length > 20) return { error: "Upload maximaal 20 foto's tegelijk." }

  const prepared: { file: File; extension: string }[] = []
  for (const file of files) {
    const inspected = inspectImage(file)
    if (inspected.error || !inspected.extension) {
      return { error: inspected.error ?? "Een foto is ongeldig." }
    }
    prepared.push({ file, extension: inspected.extension })
  }

  const stored: string[] = []
  try {
    for (const item of prepared) {
      const saved = await storeUpload(item.file, "photos", item.extension)
      stored.push(saved.storagePath)
    }
    await prisma.photo.createMany({
      data: stored.map((storagePath) => ({
        albumId,
        storagePath,
        createdById: user.id,
      })),
    })
  } catch (error) {
    await Promise.all(stored.map((storagePath) => removeStoredFile(storagePath)))
    throw error
  }

  refresh(albumId)
  return done(stored.length === 1 ? "Foto toegevoegd." : `${stored.length} foto's toegevoegd.`)
}

export async function deletePhoto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  if (!user) return { error: "Log in om een foto te verwijderen." }

  const id = String(formData.get("id") ?? "")
  const existing = await prisma.photo.findUnique({ where: { id } })
  if (!existing) return { error: "Deze foto bestaat niet meer." }
  if (!canManage(user, existing.createdById)) {
    return { error: "Je kunt alleen je eigen foto's verwijderen." }
  }

  await prisma.photo.delete({ where: { id } })
  await removeStoredFile(existing.storagePath)
  refresh(existing.albumId)
  return done("Foto verwijderd.")
}
