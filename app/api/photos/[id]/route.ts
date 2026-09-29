import { readFile } from "fs/promises"
import { auth } from "@/auth"
import { fileResponse, mimeFromPath, prismaBytes, resolveStoredFile, sniffImageMime } from "@/lib/files"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return new Response("Niet ingelogd", { status: 401 })

  const { id } = await context.params
  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { storagePath: true, imageBytes: true, imageType: true },
  })
  if (!photo) return new Response("Niet gevonden", { status: 404 })

  if (photo.imageBytes && photo.imageBytes.byteLength > 0) {
    const type = sniffImageMime(photo.imageBytes, photo.imageType || mimeFromPath(photo.storagePath))
    return fileResponse(photo.imageBytes, type)
  }

  try {
    const bytes = prismaBytes(await readFile(resolveStoredFile(photo.storagePath)))
    const type = sniffImageMime(bytes, mimeFromPath(photo.storagePath))
    await prisma.photo
      .update({ where: { id }, data: { imageBytes: bytes, imageType: type } })
      .catch(() => undefined)
    return fileResponse(bytes, type)
  } catch {
    return new Response("Niet gevonden", { status: 404 })
  }
}
