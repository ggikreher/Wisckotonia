import { MemberGallery } from "@/components/member-gallery"
import { auth } from "@/auth"
import { formatCalendarDate } from "@/lib/dates"
import { compareMembers } from "@/lib/member-order"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Leden" }

export default async function LedenPage() {
  const session = await auth()
  const members = await prisma.member.findMany({ omit: { imageBytes: true } })
  members.sort(compareMembers)

  return (
    <MemberGallery
      isAdmin={session?.user.role === "ADMIN"}
      members={members.map((member) => ({
        id: member.id,
        name: member.name,
        title: member.title,
        bio: member.bio,
        memberSince: member.memberSince ? formatCalendarDate(member.memberSince) : null,
        boardRole: member.boardRole,
        category: member.category,
        hasPhoto: Boolean(member.imagePath),
        updatedAt: member.updatedAt.toISOString(),
      }))}
    />
  )
}
