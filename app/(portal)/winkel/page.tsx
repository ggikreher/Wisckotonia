import { Shop } from "@/components/shop"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "De Wisko Winkel" }

export default async function WinkelPage() {
  const session = await auth()
  const items = await prisma.shopItem.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      },
    },
  })

  return (
    <Shop
      isAdmin={session?.user.role === "ADMIN"}
      items={items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        priceCents: item.priceCents,
        outOfStock: item.outOfStock,
        images: item.images.map((image) => image.id),
        updatedAt: item.updatedAt.toISOString(),
      }))}
    />
  )
}
