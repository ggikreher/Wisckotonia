import { auth } from "@/auth"
import { fileResponse, sniffImageMime } from "@/lib/files"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return new Response("Geen toegang", { status: 401 })

  const sponsor = await prisma.sponsorLink.findUnique({
    where: { id: "default" },
    select: { imageBytes: true, imageType: true },
  })
  if (!sponsor?.imageBytes || sponsor.imageBytes.byteLength === 0) return new Response("Niet gevonden", { status: 404 })

  const type = sniffImageMime(sponsor.imageBytes, sponsor.imageType || "application/octet-stream")
  return fileResponse(sponsor.imageBytes, type)
}
