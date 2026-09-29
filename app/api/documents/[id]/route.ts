import { readFile } from "fs/promises"
import { auth } from "@/auth"
import { resolveStoredFile, safeDownloadName } from "@/lib/files"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return new Response("Niet ingelogd", { status: 401 })

  const { id } = await context.params
  const document = await prisma.document.findUnique({ where: { id } })
  if (!document) return new Response("Niet gevonden", { status: 404 })

  const bytes = await readFile(resolveStoredFile(document.storagePath))
  const download = new URL(request.url).searchParams.get("dl") === "1"
  const filename = safeDownloadName(document.fileName).replaceAll('"', "")

  return new Response(bytes, {
    headers: {
      "Content-Type": document.mimeType || "application/octet-stream",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
