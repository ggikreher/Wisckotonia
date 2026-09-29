import { readFile } from "fs/promises"
import { auth } from "@/auth"
import { mimeFromPath, resolveStoredFile } from "@/lib/files"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return new Response("Niet ingelogd", { status: 401 })

  const { id } = await context.params
  const member = await prisma.member.findUnique({ where: { id } })
  if (!member?.imagePath) return new Response("Niet gevonden", { status: 404 })

  const bytes = await readFile(resolveStoredFile(member.imagePath))

  return new Response(bytes, {
    headers: {
      "Content-Type": mimeFromPath(member.imagePath),
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
