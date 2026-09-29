"use client"

import { CalendarDays, Files, Images, LayoutDashboard, LogOut, Menu, Shield, Users, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import { Mark } from "@/components/mark"
import { logout } from "@/lib/actions/auth"
import { roleLabel } from "@/lib/constants"
import type { SessionUser } from "@/lib/types"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Overzicht", icon: LayoutDashboard },
  { href: "/leden", label: "Leden", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/fotos", label: "Foto's", icon: Images },
  { href: "/documenten", label: "Documenten", icon: Files },
]

function NavLinks({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const pathname = usePathname()
  const items = user.role === "ADMIN" ? [...links, { href: "/admin", label: "Beheer", icon: Shield }] : links

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-white/10 text-white" : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBody({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-5 py-6">
        <Mark light className="size-9" />
        <div>
          <p className="font-serif text-lg leading-none text-white">Wisckotonia</p>
          <p className="mt-1 text-[11px] tracking-[0.16em] text-brass uppercase">Dispuut</p>
        </div>
      </div>
      <NavLinks user={user} onNavigate={onNavigate} />
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm text-white">{user.name}</p>
        <p className="truncate text-xs text-sidebar-foreground/60">@{user.username}</p>
        <p className="mt-1 text-[11px] tracking-wide text-brass uppercase">{roleLabel(user.role)}</p>
        <form action={logout}>
          <button
            type="submit"
            className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
            Uitloggen
          </button>
        </form>
      </div>
    </>
  )
}

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen md:grid md:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar text-sidebar-foreground md:flex">
        <SidebarBody user={user} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <Mark className="size-8" />
            <span className="font-serif text-lg">Wisckotonia</span>
          </div>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-secondary"
            onClick={() => setOpen(true)}
            aria-label="Menu openen"
          >
            <Menu className="size-5" />
          </button>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-[#1c1714]/50"
              aria-label="Menu sluiten"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
              <button
                type="button"
                className="absolute right-3 top-4 rounded-md p-2 text-white/80 hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Menu sluiten"
              >
                <X className="size-4" />
              </button>
              <SidebarBody user={user} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        ) : null}

        <main className="px-4 py-6 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  )
}
