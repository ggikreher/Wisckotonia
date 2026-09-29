"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { inspectImage, removeStoredFile, storeUpload } from "@/lib/files"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/types"
import { issueMessage, memberSchema } from "@/lib/validators"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

function done(message: string): ActionState {
  return { message, nonce: Date.now() }
}

export async function saveMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Alleen beheerders kunnen leden wijzigen." }

  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
    bio: formData.get("bio"),
    memberSince: formData.get("memberSince") ?? "",
    boardRole: formData.get("boardRole") ?? "",
    category: formData.get("category") ?? "",
  })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  const { memberSince, boardRole, category, ...memberFields } = parsed.data
  const memberData = {
    ...memberFields,
    memberSince: memberSince ? Number(memberSince) : null,
    boardRole: boardRole || null,
    category,
  }

  const id = String(formData.get("id") ?? "")
  const photo = formData.get("photo")
  let imagePath: string | undefined
  let previousPath: string | null = null

  if (photo instanceof File && photo.size > 0) {
    const inspected = inspectImage(photo)
    if (inspected.error || !inspected.extension) {
      return { error: inspected.error ?? "De foto is ongeldig." }
    }
    const stored = await storeUpload(photo, "members", inspected.extension)
    imagePath = stored.storagePath
  }

  if (id) {
    const existing = await prisma.member.findUnique({ where: { id } })
    if (!existing) {
      if (imagePath) await removeStoredFile(imagePath)
      return { error: "Dit lid bestaat niet meer." }
    }
    previousPath = existing.imagePath
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (memberData.boardRole) {
        await tx.member.updateMany({
          where: {
            boardRole: memberData.boardRole,
            ...(id ? { id: { not: id } } : {}),
          },
          data: { boardRole: null },
        })
      }

      if (id) {
        await tx.member.update({
          where: { id },
          data: {
            ...memberData,
            ...(imagePath ? { imagePath } : {}),
          },
        })
        return
      }

      const last = await tx.member.findFirst({ orderBy: { sortOrder: "desc" } })
      await tx.member.create({
        data: {
          ...memberData,
          imagePath,
          sortOrder: (last?.sortOrder ?? 0) + 1,
        },
      })
    })
  } catch (error) {
    if (imagePath) await removeStoredFile(imagePath)
    throw error
  }

  if (imagePath && previousPath) await removeStoredFile(previousPath)

  revalidatePath("/leden")
  revalidatePath("/punten")
  revalidatePath("/")
  return done(id ? "Lid bijgewerkt." : "Lid toegevoegd.")
}

export async function deleteMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Alleen beheerders kunnen leden verwijderen." }

  const id = String(formData.get("id") ?? "")
  const existing = await prisma.member.findUnique({ where: { id } })
  if (!existing) return { error: "Dit lid bestaat niet meer." }

  await prisma.member.delete({ where: { id } })
  await removeStoredFile(existing.imagePath)
  revalidatePath("/leden")
  revalidatePath("/")
  return done("Lid verwijderd.")
}
