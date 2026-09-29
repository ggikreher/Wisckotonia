import { PointsList } from "@/components/points-list"
import { compareMembers } from "@/lib/member-order"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Punten sparen" }

export default async function PuntenPage() {
  const members = await prisma.member.findMany({ omit: { imageBytes: true } })
  members.sort(compareMembers)

  return (
    <PointsList
      members={members.map((member) => ({
        id: member.id,
        name: member.name,
        title: member.title,
        boardRole: member.boardRole,
        pointsChoice: member.pointsChoice,
        pointsFollowUp: member.pointsFollowUp,
      }))}
    />
  )
}
