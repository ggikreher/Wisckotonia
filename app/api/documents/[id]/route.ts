import { readFile } from "fs/promises"
import { auth } from "@/auth"
import { fileResponse, resolveStoredFile, safeDownloadName } from "@/lib/files"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return new Response("Niet ingelogd", { status: 401 })

  const { id } = await context.params
  const document = await prisma.document.findUnique({ where: { id } })
  if (!document) return new Response("Niet gevonden", { status: 404 })

  const download = new URL(request.url).searchParams.get("dl") === "1"
  const filename = safeDownloadName(document.fileName).replaceAll('"', "")

  try {
    const bytes = await readFile(resolveStoredFile(document.storagePath))
    return fileResponse(bytes, document.mimeType || "application/octet-stream", {
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    })
  } catch {
    return new Response("Niet gevonden", { status: 404 })
  }
}
