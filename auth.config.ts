import { NextResponse } from "next/server"
import type { NextAuthConfig } from "next-auth"

function isAuthApi(pathname: string) {
  return pathname.startsWith("/api/auth")
}

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isLoggedIn = !!auth?.user

      if (isAuthApi(pathname)) return true

      if (pathname === "/login") {
        if (isLoggedIn) return NextResponse.redirect(new URL("/", request.nextUrl))
        return true
      }

      if (!isLoggedIn) return false

      if (pathname.startsWith("/admin") && auth?.user?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.nextUrl))
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub ?? ""
      session.user.role = token.role ?? "DISPUUT"
      session.user.username = token.username ?? ""
      return session
    },
  },
} satisfies NextAuthConfig
