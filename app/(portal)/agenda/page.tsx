import { AgendaView } from "@/components/agenda-view"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Agenda" }

export default async function AgendaPage() {
  const session = await auth()
  const userId = session?.user.id ?? ""
  const isAdmin = session?.user.role === "ADMIN"
  const [events, members] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startsAt: "asc" },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.member.findMany({
      where: { birthDate: { not: null } },
      select: { id: true, name: true, birthDate: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <AgendaView
      now={new Date().toISOString()}
      birthdays={members.flatMap((member) => {
        if (!member.birthDate) return []
        return [
          {
            id: member.id,
            name: member.name,
            year: member.birthDate.getUTCFullYear(),
            month: member.birthDate.getUTCMonth() + 1,
            day: member.birthDate.getUTCDate(),
          },
        ]
      })}
      events={events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt?.toISOString() ?? null,
        createdByName: event.createdBy?.name ?? null,
        canManage: isAdmin || event.createdById === userId,
      }))}
    />
  )
}
