import { mkdir, writeFile } from "fs/promises"
import path from "path"
import bcrypt from "bcryptjs"
import { PrismaClient, type Role } from "@prisma/client"
import { amsterdamLocalToDate } from "../lib/dates"

const prisma = new PrismaClient()
const uploadRoot = path.join(process.cwd(), "uploads")

const portraits = ["#6e2433", "#1c3b34", "#3c4d6e", "#6a4528", "#4c3348", "#2d4a3a", "#243e48", "#5c3a32"]

function portraitSvg(initials: string, color: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <rect width="400" height="500" fill="${color}"/>
  <circle cx="200" cy="168" r="92" fill="none" stroke="#f4efe6" stroke-width="2"/>
  <text x="200" y="188" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="#f4efe6">${initials}</text>
  <text x="200" y="430" text-anchor="middle" font-family="Georgia, serif" font-size="18" letter-spacing="6" fill="#e7d3ae">WISCKOTONIA</text>
</svg>`
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

const members = [
  {
    name: "Lotte van den Berg",
    title: "Praeses",
    memberSince: new Date(Date.UTC(2021, 0, 1)),
    boardRole: "VOORZITTER" as const,
    bio: "Zorgt dat de vergadering op tijd begint en de borrel nooit te vroeg eindigt.",
  },
  {
    name: "Daan Kuipers",
    title: "Abactis",
    memberSince: new Date(Date.UTC(2020, 0, 1)),
    boardRole: "SECRETARIS" as const,
    bio: "Houdt de notulen bij, beantwoordt de mail en weet waar elk document staat.",
  },
  {
    name: "Sofie Hendriks",
    title: "Quaestor",
    memberSince: new Date(Date.UTC(2022, 0, 1)),
    boardRole: "PENNINGMEESTER" as const,
    bio: "Bewaakt de kas, de contributie en de vraag of die extra fles nog verantwoord is.",
  },
  {
    name: "Milan de Vries",
    title: "Assessor",
    memberSince: new Date(Date.UTC(2023, 0, 1)),
    bio: "Regelt de introductie en weet van elk nieuw lid al een anekdote.",
  },
  {
    name: "Noor Bakker",
    title: "Commissaris activiteiten",
    memberSince: new Date(Date.UTC(2019, 0, 1)),
    bio: "Van dies tot diner: als het in de agenda staat, heeft Noor het bedacht.",
  },
  {
    name: "Thomas Jansen",
    title: "Lid",
    memberSince: new Date(Date.UTC(2024, 0, 1)),
    bio: "Altijd aanwezig, zelden op tijd, en onmisbaar bij het opruimen.",
  },
  {
    name: "Emma Visser",
    title: "Lid",
    memberSince: new Date(Date.UTC(2022, 0, 1)),
    bio: "Schrijft de jaarredes en corrigeert discreet andermans Latijn.",
  },
  {
    name: "Ruben Smit",
    title: "Oud-praeses",
    memberSince: new Date(Date.UTC(2016, 0, 1)),
    bio: "Weet nog hoe het vroeger ging, en vertelt dat graag bij de derde ronde.",
  },
]

const documents = [
  {
    title: "Statuten (uittreksel)",
    category: "Statuten",
    fileName: "Statuten-uittreksel.txt",
    body: `WISCKOTONIA — UITTREKSEL UIT DE STATUTEN
Voorbeelddocument, ter vervanging door de echte stukken.

Artikel 1. Naam en zetel
Het dispuut draagt de naam Wisckotonia.

Artikel 2. Doel
Het dispuut stelt zich ten doel de vriendschap tussen haar leden te onderhouden en gezamenlijke activiteiten te organiseren.

Artikel 3. Lidmaatschap
Leden worden toegelaten door het bestuur. Het lidmaatschap is persoonlijk.

Artikel 4. Bestuur
Het bestuur bestaat ten minste uit een praeses, een abactis en een quaestor.
`,
  },
  {
    title: "Huishoudelijk reglement",
    category: "Reglementen",
    fileName: "Huishoudelijk-reglement.txt",
    body: `WISCKOTONIA — HUISHOUDELIJK REGLEMENT
Voorbeelddocument.

1. Vergaderingen worden bijeengeroepen door de praeses, met de agenda die de abactis rondstuurt.
2. De quaestor legt eenmaal per jaar rekening en verantwoording af.
3. Stukken van het dispuut zijn alleen toegankelijk voor leden, via dit platform.
4. Wijzigingen van dit reglement vereisen een besluit van de algemene ledenvergadering.
`,
  },
]

async function upsertUser(input: {
  username: string
  email: string
  name: string
  password: string
  role: Role
}) {
  const passwordHash = await bcrypt.hash(input.password, 12)
  await prisma.user.upsert({
    where: { email: input.email },
    update: {},
    create: {
      username: input.username,
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
    },
  })
}

async function main() {
  await upsertUser({
    username: "admin",
    email: "admin@wisckotonia.nl",
    name: "Beheer Wisckotonia",
    password: "WisckoAdmin2026!",
    role: "ADMIN",
  })
  await upsertUser({
    username: "lid",
    email: "lid@wisckotonia.nl",
    name: "Alex de Boer",
    password: "WisckoLid2026!",
    role: "DISPUUT",
  })

  if ((await prisma.member.count()) === 0) {
    await mkdir(path.join(uploadRoot, "members"), { recursive: true })
    for (const [index, member] of members.entries()) {
      const created = await prisma.member.create({
        data: { ...member, sortOrder: index + 1 },
      })
      const storagePath = `members/${created.id}.svg`
      await writeFile(
        path.join(uploadRoot, storagePath),
        portraitSvg(initials(member.name), portraits[index % portraits.length] ?? "#6e2433"),
        "utf8",
      )
      await prisma.member.update({
        where: { id: created.id },
        data: { imagePath: storagePath },
      })
    }
  }

  const admin = await prisma.user.findUnique({ where: { email: "admin@wisckotonia.nl" } })

  if ((await prisma.event.count()) === 0) {
    const rows = [
      ["2026-09-18T20:00", "2026-09-18T23:30", "Kennismakingsborrel", "Sociëteit Wisckotonia", "Informele avond voor nieuwe en oude leden. Geen speeches, wel een eerste ronde."],
      ["2026-09-29T21:00", "2026-09-30T00:00", "Naborrel", "Sociëteit Wisckotonia", "Korte naborrel na de vergadering. Wie wil, blijft hangen."],
      ["2026-10-02T20:30", "2026-10-03T00:30", "Constitutieborrel", "Sociëteit Wisckotonia", "De eerste grote borrel van het jaar. De praeses opent, de rest regelt zich vanzelf."],
      ["2026-10-16T19:00", "2026-10-16T21:30", "Algemene ledenvergadering", "Vergaderzaal", "Begroting, activiteiten en de samenstelling van het bestuur. Stukken staan bij Documenten."],
      ["2026-11-07T18:00", "2026-11-07T23:30", "Dies Natalis", "Sociëteit Wisckotonia", "De dies van Wisckotonia, met een korte rede en daarna een lange avond."],
      ["2026-12-12T18:30", "2026-12-12T23:00", "Jaardiner", "Restaurant De Kade", "Formeler dan de borrel, en het enige moment waarop iedereen op tijd probeert te zijn."],
    ] as const

    for (const [start, end, title, location, description] of rows) {
      const startsAt = amsterdamLocalToDate(start)
      const endsAt = amsterdamLocalToDate(end)
      if (!startsAt || !endsAt) throw new Error(`Ongeldige datum voor ${title}`)
      await prisma.event.create({
        data: { title, location, description, startsAt, endsAt, createdById: admin?.id },
      })
    }
  }

  if (admin) {
    await prisma.event.updateMany({
      where: { createdById: null },
      data: { createdById: admin.id },
    })
  }

  if ((await prisma.document.count()) === 0) {
    await mkdir(path.join(uploadRoot, "documents"), { recursive: true })
    for (const document of documents) {
      const storagePath = `documents/${crypto.randomUUID()}.txt`
      const body = Buffer.from(document.body, "utf8")
      await writeFile(path.join(uploadRoot, storagePath), body)
      await prisma.document.create({
        data: {
          title: document.title,
          category: document.category,
          fileName: document.fileName,
          storagePath,
          mimeType: "text/plain; charset=utf-8",
          sizeBytes: body.length,
        },
      })
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
