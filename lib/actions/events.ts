"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { amsterdamLocalToDate } from "@/lib/dates"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/types"
import { eventSchema, issueMessage } from "@/lib/validators"

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

function parseRange(startsAt: string, endsAt?: string) {
  const start = amsterdamLocalToDate(startsAt)
  if (!start) return { error: "Vul een geldige datum en tijd in." }
  const end = endsAt ? amsterdamLocalToDate(endsAt) : null
  if (endsAt && !end) return { error: "Vul een geldig eindtijdstip in." }
  if (end && end.getTime() <= start.getTime()) {
    return { error: "Het eindtijdstip moet na het begin liggen." }
  }
  return { start, end }
}

export async function saveEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  if (!user) return { error: "Log in om een evenement op te slaan." }

  const endsRaw = String(formData.get("endsAt") ?? "").trim()
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    location: formData.get("location"),
    description: formData.get("description"),
    startsAt: formData.get("startsAt"),
    endsAt: endsRaw || undefined,
  })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  const range = parseRange(parsed.data.startsAt, parsed.data.endsAt)
  if ("error" in range) return { error: range.error }

  const id = String(formData.get("id") ?? "")
  const data = {
    title: parsed.data.title,
    location: parsed.data.location,
    description: parsed.data.description,
    startsAt: range.start,
    endsAt: range.end,
  }

  if (id) {
    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) return { error: "Dit evenement bestaat niet meer." }
    if (!canManage(user, existing.createdById)) {
      return { error: "Je kunt alleen je eigen evenementen aanpassen." }
    }
    await prisma.event.update({ where: { id }, data })
  } else {
    await prisma.event.create({
      data: { ...data, createdById: user.id },
    })
  }

  revalidatePath("/agenda")
  revalidatePath("/")
  return done(id ? "Evenement bijgewerkt." : "Evenement toegevoegd.")
}

export async function deleteEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  if (!user) return { error: "Log in om een evenement te verwijderen." }

  const id = String(formData.get("id") ?? "")
  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) return { error: "Dit evenement bestaat niet meer." }
  if (!canManage(user, existing.createdById)) {
    return { error: "Je kunt alleen je eigen evenementen verwijderen." }
  }

  await prisma.event.delete({ where: { id } })
  revalidatePath("/agenda")
  revalidatePath("/")
  return done("Evenement verwijderd.")
}
