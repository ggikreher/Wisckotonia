import { auth } from "@/auth"
import { fileResponse, sniffImageMime } from "@/lib/files"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return new Response("Niet ingelogd", { status: 401 })

  const { id } = await context.params
  const image = await prisma.shopImage.findUnique({
    where: { id },
    select: { imageBytes: true, imageType: true },
  })
  if (!image?.imageBytes || image.imageBytes.byteLength === 0) return new Response("Niet gevonden", { status: 404 })

  const type = sniffImageMime(image.imageBytes, image.imageType || "application/octet-stream")
  return fileResponse(image.imageBytes, type)
}
