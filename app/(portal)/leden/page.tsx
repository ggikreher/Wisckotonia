import { MemberGallery } from "@/components/member-gallery"
import { auth } from "@/auth"
import { BOARD_ROLES } from "@/lib/constants"
import { prisma } from "@/lib/prisma"
import type { BoardRole } from "@/lib/types"

export const metadata = { title: "Leden" }

const roleRank = new Map<BoardRole, number>(BOARD_ROLES.map((role, index) => [role, index]))

function compareMembers(
  a: { boardRole: BoardRole | null; memberSince: number | null; name: string },
  b: { boardRole: BoardRole | null; memberSince: number | null; name: string },
) {
  const aRole = a.boardRole ? roleRank.get(a.boardRole) : undefined
  const bRole = b.boardRole ? roleRank.get(b.boardRole) : undefined
  if (aRole !== undefined && bRole !== undefined) return aRole - bRole
  if (aRole !== undefined) return -1
  if (bRole !== undefined) return 1
  if (a.memberSince == null && b.memberSince == null) return a.name.localeCompare(b.name, "nl")
  if (a.memberSince == null) return 1
  if (b.memberSince == null) return -1
  if (a.memberSince !== b.memberSince) return a.memberSince - b.memberSince
  return a.name.localeCompare(b.name, "nl")
}

export default async function LedenPage() {
  const session = await auth()
  const members = await prisma.member.findMany()
  members.sort(compareMembers)

  return (
    <MemberGallery
      isAdmin={session?.user.role === "ADMIN"}
      members={members.map((member) => ({
        id: member.id,
        name: member.name,
        title: member.title,
        bio: member.bio,
        memberSince: member.memberSince,
        boardRole: member.boardRole,
        hasPhoto: Boolean(member.imagePath),
        updatedAt: member.updatedAt.toISOString(),
      }))}
    />
  )
}
