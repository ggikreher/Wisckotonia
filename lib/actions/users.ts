"use server"

import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/types"
import { createUserSchema, issueMessage, updateUserSchema } from "@/lib/validators"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

function done(message: string): ActionState {
  return { message, nonce: Date.now() }
}

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Je hebt geen rechten om accounts aan te maken." }

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        username: parsed.data.username.toLowerCase(),
        email: parsed.data.email.toLowerCase(),
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        role: parsed.data.role,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Deze gebruikersnaam of dit e-mailadres is al in gebruik." }
    }
    throw error
  }

  revalidatePath("/admin")
  return done("Account aangemaakt.")
}

export async function updateUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Je hebt geen rechten om accounts te wijzigen." }

  const id = String(formData.get("id") ?? "")
  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    password: String(formData.get("password") ?? ""),
  })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return { error: "Dit account bestaat niet meer." }

  if (existing.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } })
    if (admins <= 1) return { error: "Er moet minstens één beheerder blijven." }
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      role: parsed.data.role,
      ...(parsed.data.password
        ? { passwordHash: await bcrypt.hash(parsed.data.password, 12) }
        : {}),
    },
  })

  revalidatePath("/admin")
  revalidatePath("/")

  if (existing.id === admin.id && parsed.data.role !== "ADMIN") {
    redirect("/")
  }

  return done("Account bijgewerkt.")
}

export async function deleteUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Je hebt geen rechten om accounts te verwijderen." }

  const id = String(formData.get("id") ?? "")
  if (id === admin.id) return { error: "Je kunt je eigen account niet verwijderen." }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return { error: "Dit account bestaat niet meer." }

  if (existing.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } })
    if (admins <= 1) return { error: "De laatste beheerder kan niet worden verwijderd." }
  }

  await prisma.user.delete({ where: { id } })
  revalidatePath("/admin")
  return done("Account verwijderd.")
}
