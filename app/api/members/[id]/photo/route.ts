import { readFile } from "fs/promises"
import { auth } from "@/auth"
import { fileResponse, mimeFromPath, prismaBytes, resolveStoredFile, sniffImageMime } from "@/lib/files"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return new Response("Niet ingelogd", { status: 401 })

  const { id } = await context.params
  const member = await prisma.member.findUnique({
    where: { id },
    select: { imagePath: true, imageBytes: true, imageType: true },
  })
  if (!member) return new Response("Niet gevonden", { status: 404 })

  if (member.imageBytes && member.imageBytes.byteLength > 0) {
    const type = sniffImageMime(member.imageBytes, member.imageType || "application/octet-stream")
    return fileResponse(member.imageBytes, type)
  }

  if (!member.imagePath) return new Response("Niet gevonden", { status: 404 })

  try {
    const bytes = prismaBytes(await readFile(resolveStoredFile(member.imagePath)))
    const type = sniffImageMime(bytes, mimeFromPath(member.imagePath))
    await prisma.member
      .update({ where: { id }, data: { imageBytes: bytes, imageType: type } })
      .catch(() => undefined)
    return fileResponse(bytes, type)
  } catch {
    return new Response("Niet gevonden", { status: 404 })
  }
}
