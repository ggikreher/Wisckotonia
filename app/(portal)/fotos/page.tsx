import { PhotoLibrary } from "@/components/photo-library"
import { auth } from "@/auth"
import { formatCalendarDate } from "@/lib/dates"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Foto's" }

export default async function FotosPage() {
  const session = await auth()
  const userId = session?.user.id ?? ""
  const isAdmin = session?.user.role === "ADMIN"

  const albums = await prisma.photoAlbum.findMany({
    include: {
      createdBy: { select: { name: true } },
      photos: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true } },
      _count: { select: { photos: true } },
    },
  })

  albums.sort((a, b) => {
    if (a.eventDate && b.eventDate) return b.eventDate.getTime() - a.eventDate.getTime()
    if (a.eventDate) return -1
    if (b.eventDate) return 1
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  return (
    <PhotoLibrary
      albums={albums.map((album) => ({
        id: album.id,
        name: album.name,
        eventDate: album.eventDate ? formatCalendarDate(album.eventDate) : null,
        photoCount: album._count.photos,
        coverPhotoId: album.photos[0]?.id ?? null,
        createdByName: album.createdBy?.name ?? null,
        canManage: isAdmin || album.createdById === userId,
      }))}
    />
  )
}
