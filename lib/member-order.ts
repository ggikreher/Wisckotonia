import { BOARD_ROLES } from "@/lib/constants"
import type { BoardRole } from "@/lib/types"

const roleRank = new Map<BoardRole, number>(BOARD_ROLES.map((role, index) => [role, index]))

export function compareMembers(
  a: { boardRole: BoardRole | null; memberSince: Date | null; name: string },
  b: { boardRole: BoardRole | null; memberSince: Date | null; name: string },
) {
  const aRole = a.boardRole ? roleRank.get(a.boardRole) : undefined
  const bRole = b.boardRole ? roleRank.get(b.boardRole) : undefined
  if (aRole !== undefined && bRole !== undefined) return aRole - bRole
  if (aRole !== undefined) return -1
  if (bRole !== undefined) return 1
  if (a.memberSince == null && b.memberSince == null) return a.name.localeCompare(b.name, "nl")
  if (a.memberSince == null) return 1
  if (b.memberSince == null) return -1
  if (a.memberSince.getTime() !== b.memberSince.getTime()) return a.memberSince.getTime() - b.memberSince.getTime()
  return a.name.localeCompare(b.name, "nl")
}
