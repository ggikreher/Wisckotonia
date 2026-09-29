import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { auth } from "@/auth"

function safeCallback(value: string | undefined) {
  if (!value) return "/"
  if (value.startsWith("/") && !value.startsWith("//")) return value
  try {
    const url = new URL(value)
    if (url.pathname.startsWith("/")) return `${url.pathname}${url.search}`
  } catch {
    return "/"
  }
  return "/"
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>
}) {
  const session = await auth()
  if (session?.user) redirect("/")

  const params = await searchParams
  const raw = Array.isArray(params.callbackUrl) ? params.callbackUrl[0] : params.callbackUrl

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <p aria-hidden className="pointer-events-none absolute -right-8 top-0 font-serif text-[18rem] leading-none text-foreground/[0.04]">
        W
      </p>
      <div className="relative w-full max-w-md">
        <p className="text-[11px] font-medium tracking-[0.22em] text-brass uppercase">Dispuut</p>
        <h1 className="mt-2 font-serif text-5xl tracking-tight">Wisckotonia</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Besloten platform voor dispuutsgenoten. Log in om de leden, de agenda en de documenten te bekijken.
        </p>
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <LoginForm callbackUrl={safeCallback(raw)} />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">Nog geen Account? Neem contact op met Sjon</p>
      </div>
    </main>
  )
}
