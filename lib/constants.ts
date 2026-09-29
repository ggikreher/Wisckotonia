import type { BoardRole, MemberCategory, PointsChoice, Role } from "@/lib/types"

export const BOARD_ROLES = ["VOORZITTER", "PENNINGMEESTER", "SECRETARIS"] as const

const BOARD_ROLE_LABELS: Record<BoardRole, string> = {
  VOORZITTER: "Voorzitter",
  PENNINGMEESTER: "Penningmeester",
  SECRETARIS: "Secretaris",
}

export function boardRoleLabel(role: BoardRole) {
  return BOARD_ROLE_LABELS[role]
}

export const MEMBER_CATEGORIES = ["WISCKO", "LES_WISKO", "MALT_WISCKO"] as const

const MEMBER_CATEGORY_LABELS: Record<MemberCategory, string> = {
  WISCKO: "Wiscko",
  LES_WISKO: "Les-Wisko",
  MALT_WISCKO: "Malt-Wiscko",
}

export function memberCategoryLabel(category: MemberCategory) {
  return MEMBER_CATEGORY_LABELS[category]
}

export const POINTS_CHOICES = [
  "WHISKY_KRACHTIG",
  "WHISKY_MEDIUM",
  "WHISKY_MILD",
  "WHISKY_VOL",
  "WHISKY_ARTIKEL",
  "KORTING_WEEKEND",
  "KORTING_KLEDING",
  "DUURDERE_FLES",
] as const

const POINTS_CHOICE_LABELS: Record<PointsChoice, string> = {
  WHISKY_KRACHTIG: "Whisky Krachtig & Rokerig",
  WHISKY_MEDIUM: "Whisky Medium & Granig",
  WHISKY_MILD: "Whisky Mild & Zacht",
  WHISKY_VOL: "Whisky Vol & Rijk",
  WHISKY_ARTIKEL: "Whisky gerelateerd artikel (s.v.p vervolg vraag invullen)",
  KORTING_WEEKEND: "Korting op het WisckoWeekend",
  KORTING_KLEDING: "Korting op WisckoKleding",
  DUURDERE_FLES: "Sparen voor een duurdere fles whisky",
}

export function pointsChoiceLabel(choice: PointsChoice) {
  return POINTS_CHOICE_LABELS[choice]
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
