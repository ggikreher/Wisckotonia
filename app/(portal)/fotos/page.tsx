import { PhotoLibrary } from "@/components/photo-library"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Foto's" }

export default async function FotosPage() {
  const session = await auth()
  const userId = session?.user.id ?? ""
  const isAdmin = session?.user.role === "ADMIN"

  const albums = await prisma.photoAlbum.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      photos: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true } },
      _count: { select: { photos: true } },
    },
  })

  return (
    <PhotoLibrary
      albums={albums.map((album) => ({
        id: album.id,
        name: album.name,
        photoCount: album._count.photos,
        coverPhotoId: album.photos[0]?.id ?? null,
        createdByName: album.createdBy?.name ?? null,
        canManage: isAdmin || album.createdById === userId,
      }))}
    />
  )
}
