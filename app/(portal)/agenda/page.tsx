import { AgendaView } from "@/components/agenda-view"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Agenda" }

export default async function AgendaPage() {
  const session = await auth()
  const userId = session?.user.id ?? ""
  const isAdmin = session?.user.role === "ADMIN"
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "asc" },
    include: { createdBy: { select: { name: true } } },
  })

  return (
    <AgendaView
      now={new Date().toISOString()}
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
