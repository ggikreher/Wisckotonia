import { notFound } from "next/navigation"
import { PhotoAlbumView } from "@/components/photo-album"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const album = await prisma.photoAlbum.findUnique({ where: { id }, select: { name: true } })
  return { title: album?.name ?? "Map" }
}

export default async function FotoAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user.id ?? ""
  const isAdmin = session?.user.role === "ADMIN"

  const album = await prisma.photoAlbum.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      photos: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdById: true,
          createdBy: { select: { name: true } },
        },
      },
    },
  })
  if (!album) notFound()

  return (
    <PhotoAlbumView
      album={{
        id: album.id,
        name: album.name,
        createdByName: album.createdBy?.name ?? null,
        canManage: isAdmin || album.createdById === userId,
        photos: album.photos.map((photo) => ({
          id: photo.id,
          createdByName: photo.createdBy?.name ?? null,
          canDelete: isAdmin || photo.createdById === userId,
        })),
      }}
    />
  )
}
