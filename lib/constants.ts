import type { BoardRole, Role } from "@/lib/types"

export const BOARD_ROLES = ["VOORZITTER", "PENNINGMEESTER", "SECRETARIS"] as const

const BOARD_ROLE_LABELS: Record<BoardRole, string> = {
  VOORZITTER: "Voorzitter",
  PENNINGMEESTER: "Penningmeester",
  SECRETARIS: "Secretaris",
}

export function boardRoleLabel(role: BoardRole) {
  return BOARD_ROLE_LABELS[role]
}

export const DOCUMENT_CATEGORIES = [
  "Statuten",
  "Reglementen",
  "Jaarverslagen",
  "Notulen",
  "Overig",
] as const

export function roleLabel(role: Role) {
  return role === "ADMIN" ? "Beheerder" : "Dispuutslid"
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
