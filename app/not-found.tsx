import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-[11px] tracking-[0.2em] text-brass uppercase">404</p>
      <h1 className="mt-2 font-serif text-4xl">Pagina niet gevonden</h1>
      <Link href="/" className="mt-6 text-sm text-primary hover:underline">
        Terug naar het overzicht
      </Link>
    </main>
  )
}
