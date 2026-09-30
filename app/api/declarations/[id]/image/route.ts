import { auth } from "@/auth"
import { fileResponse, sniffImageMime } from "@/lib/files"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return new Response("Geen toegang", { status: 403 })

  const { id } = await context.params
  const claim = await prisma.declaration.findUnique({
    where: { id },
    select: { imageBytes: true, imageType: true },
  })
  if (!claim?.imageBytes || claim.imageBytes.byteLength === 0) return new Response("Niet gevonden", { status: 404 })

  const type = sniffImageMime(claim.imageBytes, claim.imageType || "application/octet-stream")
  return fileResponse(claim.imageBytes, type)
}
