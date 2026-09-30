import Link from "next/link"
import { DateBadge } from "@/components/date-badge"
import { auth } from "@/auth"
import { amsterdamParts, formatDayMonth, formatTime, greetingForNow, nextBirthday } from "@/lib/dates"
import { BOARD_ROLES, boardRoleLabel } from "@/lib/constants"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  const session = await auth()
  const name = session?.user.name ?? session?.user.username ?? "dispuutsgenoot"
  const now = new Date()

  const [memberCount, documentCount, albumCount, upcomingCount, board, upcoming, members] = await Promise.all([
    prisma.member.count(),
    prisma.document.count(),
    prisma.photoAlbum.count(),
    prisma.event.count({ where: { startsAt: { gte: now } } }),
    prisma.member.findMany({
      where: { boardRole: { not: null } },
      select: { name: true, boardRole: true },
    }),
    prisma.event.findMany({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 3,
    }),
    prisma.member.findMany({
      where: { birthDate: { not: null } },
      select: { id: true, name: true, birthDate: true },
    }),
  ])

  const today = amsterdamParts(now)
  const nextBirthdays = members
    .flatMap((member) => {
      if (!member.birthDate) return []
      const occurrence = nextBirthday(
        {
          year: member.birthDate.getUTCFullYear(),
          month: member.birthDate.getUTCMonth() + 1,
          day: member.birthDate.getUTCDate(),
        },
        today,
      )
      return [{ id: member.id, name: member.name, ...occurrence }]
    })
    .sort((a, b) => a.key.localeCompare(b.key) || a.name.localeCompare(b.name, "nl"))
    .slice(0, 3)

  const stats = [
    { label: "Leden", value: memberCount, href: "/leden" },
    { label: "Komende avonden", value: upcomingCount, href: "/agenda" },
    { label: "Fotomapjes", value: albumCount, href: "/fotos" },
    { label: "Documenten", value: documentCount, href: "/documenten" },
  ]

  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.2em] text-brass uppercase">Overzicht</p>
      <h1 className="mt-2 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{greetingForNow(name)}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Dit is de besloten plek van Wisckotonia. Hier vind je de dispuutsgenoten, wat er op de planning staat, de foto's en de stukken die ertoe doen.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.href}>
            <Link href={stat.href} className="block rounded-xl border border-border bg-card px-4 py-4 hover:border-brass/50">
              <span className="font-serif text-3xl">{stat.value}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{stat.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-serif text-2xl">Bestuur</h2>
          <Link href="/leden" className="text-sm text-primary hover:underline">
            Leden
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {BOARD_ROLES.map((role) => {
            const holder = board.find((member) => member.boardRole === role)
            return (
              <li key={role} className="rounded-xl border border-border bg-card px-4 py-4">
                <p className="text-[11px] tracking-[0.16em] text-brass uppercase">{boardRoleLabel(role)}</p>
                <p className="mt-1 font-serif text-2xl">{holder?.name ?? "Nog niet aangewezen"}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-serif text-2xl">Eerstvolgende</h2>
            <Link href="/agenda" className="text-sm text-primary hover:underline">
              Hele agenda
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              Er staan geen komende evenementen in de agenda.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <Link href="/agenda" className="flex gap-4 rounded-xl border border-border bg-card p-4 hover:border-brass/50">
                    <DateBadge iso={event.startsAt.toISOString()} />
                    <span className="min-w-0">
                      <span className="block font-serif text-xl">{event.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {formatTime(event.startsAt)} · {event.location}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-serif text-2xl">Eerstvolgende jarigen</h2>
            <Link href="/agenda" className="text-sm text-primary hover:underline">
              Agenda
            </Link>
          </div>
          {nextBirthdays.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              Er zijn nog geen geboortedatums ingevuld.
            </p>
          ) : (
            <ul className="divide-y divide-[#cfe8d6] overflow-hidden rounded-xl border border-[#b7e4c7] bg-[#f3fbf5]">
              {nextBirthdays.map((member) => (
                <li key={member.id}>
                  <Link href="/agenda" className="block px-4 py-3 hover:bg-[#e7f8ec]">
                    <span className="block font-medium">{member.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {member.key === today.key
                        ? "Vandaag"
                        : formatDayMonth(member.year, member.month, member.day)}
                      {" · wordt "}
                      {member.age}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
