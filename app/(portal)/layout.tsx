import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { auth } from "@/auth"

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <AppShell
      user={{
        name: session.user.name ?? session.user.username,
        username: session.user.username,
        role: session.user.role,
      }}
    >
      {children}
    </AppShell>
  )
}
