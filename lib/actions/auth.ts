"use server"

import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"
import { authSecret } from "@/lib/auth-secret"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/types"

function safeCallback(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return value
  try {
    const url = new URL(value)
    if (url.pathname.startsWith("/")) return `${url.pathname}${url.search}`
  } catch {
    return "/"
  }
  return "/"
}

export async function authenticate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const identifier = String(formData.get("identifier") ?? "")
  const password = String(formData.get("password") ?? "")
  const redirectTo = safeCallback(String(formData.get("callbackUrl") ?? "/"))

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirectTo,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Onjuiste gebruikersnaam of wachtwoord." }
    }
    throw error
  }

  return {}
}

async function ensureBootstrapAdmin() {
  const existing = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  })
  if (existing) return

  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12)
  try {
    await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@wisckotonia.nl",
        name: "Beheer Wisckotonia",
        passwordHash,
        role: "ADMIN",
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return
    throw error
  }
}

export async function loginAsAdmin(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    await ensureBootstrapAdmin()
  } catch {
    return { error: "De database is niet bereikbaar. Controleer DATABASE_URL op de server." }
  }

  try {
    await signIn("credentials", {
      adminShortcut: authSecret(),
      redirectTo: "/admin",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Inloggen als beheerder is mislukt." }
    }
    throw error
  }

  return {}
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}
