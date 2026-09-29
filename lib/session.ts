import { auth } from "@/auth"
import type { Role } from "@/lib/types"

export async function requireUser() {
  const session = await auth()
  if (!session?.user) return null
  return session.user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (!user || user.role !== "ADMIN") return null
  return user
}

export function isRole(value: string): value is Role {
  return value === "ADMIN" || value === "DISPUUT"
}
