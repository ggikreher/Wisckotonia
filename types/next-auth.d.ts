import { DefaultSession } from "next-auth"
import type { Role } from "@/lib/types"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      username: string
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    username: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role
    username?: string
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role
    username?: string
  }
}
