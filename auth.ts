import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "@/auth.config"
import { prisma } from "@/lib/prisma"

const credentialsSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1).max(72),
})

let dummyHashPromise: Promise<string> | null = null

function dummyHash() {
  dummyHashPromise ??= bcrypt.hash("wisckotonia-timing-pad", 12)
  return dummyHashPromise
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Gebruikersnaam of e-mail" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const identifier = parsed.data.identifier.toLowerCase()
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }],
          },
        })

        const hash = user?.passwordHash ?? (await dummyHash())
        const valid = await bcrypt.compare(parsed.data.password, hash)
        if (!user || !valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          username: user.username,
        }
      },
    }),
  ],
})
