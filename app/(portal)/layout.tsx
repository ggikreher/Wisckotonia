import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const sponsor = await prisma.sponsorLink.findUnique({
    where: { id: "default" },
    select: { url: true, imageType: true, updatedAt: true },
  })

  return (
    <AppShell
      user={{
        name: session.user.name ?? session.user.username,
        username: session.user.username,
        role: session.user.role,
      }}
      sponsor={{
        url: sponsor?.url ?? "",
        hasImage: Boolean(sponsor?.imageType),
        updatedAt: sponsor?.updatedAt.toISOString() ?? null,
      }}
    >
      {children}
    </AppShell>
  )
}
