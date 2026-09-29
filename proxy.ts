import NextAuth from "next-auth"
import type { NextRequest } from "next/server"
import { authConfig } from "@/auth.config"

/**
 * Toegangscontrole voor de hele applicatie.
 * In Next.js 16 heet dit bestand proxy.ts; het vervangt middleware.ts.
 * Niet-ingelogde bezoekers gaan naar /login. /admin is alleen voor ADMIN.
 */
const { auth } = NextAuth(authConfig)

export async function proxy(request: NextRequest) {
  const handle = auth as unknown as (request: NextRequest) => Promise<Response | undefined>
  return handle(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
