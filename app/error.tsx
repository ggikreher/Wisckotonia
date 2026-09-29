"use client"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-4xl">Er ging iets mis</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        De pagina kon niet worden geladen. Probeer het opnieuw.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Opnieuw proberen
      </button>
    </main>
  )
}
