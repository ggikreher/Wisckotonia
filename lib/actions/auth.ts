"use server"

import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"
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

export async function logout() {
  await signOut({ redirectTo: "/login" })
}
