import { DocumentLibrary } from "@/components/document-library"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Documenten" }

export default async function DocumentenPage() {
  const session = await auth()
  const documents = await prisma.document.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
  })

  return (
    <DocumentLibrary
      isAdmin={session?.user.role === "ADMIN"}
      documents={documents.map((document) => ({
        id: document.id,
        title: document.title,
        category: document.category,
        fileName: document.fileName,
        sizeBytes: document.sizeBytes,
        createdAt: document.createdAt.toISOString(),
      }))}
    />
  )
}
