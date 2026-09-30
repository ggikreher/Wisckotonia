"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { inspectImage, prismaBytes, sniffImageMime } from "@/lib/files"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/types"
import { issueMessage, shopItemPriceCents, shopItemQuantity, shopItemSchema } from "@/lib/validators"

function done(message: string): ActionState {
  return { message, nonce: Date.now() }
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

const MAX_IMAGES = 8
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

async function readImages(formData: FormData) {
  const files = formData.getAll("images").filter((file): file is File => file instanceof File && file.size > 0)
  if (files.length > MAX_IMAGES) {
    return { error: "Je kunt maximaal 8 afbeeldingen per keer toevoegen." }
  }
  const total = files.reduce((sum, file) => sum + file.size, 0)
  if (total > MAX_UPLOAD_BYTES) {
    return { error: "De foto's samen mogen maximaal 12 MB zijn." }
  }

  const images: { bytes: Uint8Array<ArrayBuffer>; type: string }[] = []
  for (const file of files) {
    const inspected = inspectImage(file)
    if (inspected.error) return { error: inspected.error }
    const bytes = prismaBytes(new Uint8Array(await file.arrayBuffer()))
    const type = sniffImageMime(bytes, file.type || "application/octet-stream")
    if (!type.startsWith("image/") || type === "image/svg+xml") {
      return { error: "Gebruik JPG-, PNG- of WebP-bestanden." }
    }
    images.push({ bytes, type })
  }
  return { images }
}

export async function saveShopItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Alleen beheerders kunnen een tegel plaatsen." }

  const parsed = shopItemSchema.safeParse({
    description: formData.get("description"),
    quantity: formData.get("quantity") ?? "",
    price: formData.get("price") ?? "",
  })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  const quantity = shopItemQuantity(parsed.data.quantity)
  const priceCents = shopItemPriceCents(parsed.data.price)
  if (quantity == null || priceCents == null) return { error: "Controleer aantal en kosten." }

  const uploaded = await readImages(formData)
  if (uploaded.error || !uploaded.images) return { error: uploaded.error ?? "De foto's zijn ongeldig." }

  const id = String(formData.get("id") ?? "")
  const outOfStock = formData.get("outOfStock") === "1"
  if (id) {
    const existing = await prisma.shopItem.findUnique({
      where: { id },
      select: { images: { select: { id: true, sortOrder: true } } },
    })
    if (!existing) return { error: "Deze tegel bestaat niet meer." }

    const removeIds = new Set(formData.getAll("removeImage").map(String))
    const kept = existing.images.filter((image) => !removeIds.has(image.id))
    if (kept.length + uploaded.images.length > MAX_IMAGES) {
      return { error: "Een tegel kan maximaal 8 afbeeldingen hebben." }
    }
    const nextOrder = kept.reduce((max, image) => Math.max(max, image.sortOrder), -1) + 1

    await prisma.$transaction([
      prisma.shopItem.update({
        where: { id },
        data: { description: parsed.data.description, quantity, priceCents, outOfStock },
      }),
      prisma.shopImage.deleteMany({ where: { id: { in: [...removeIds] }, itemId: id } }),
      ...uploaded.images.map((image, index) =>
        prisma.shopImage.create({
          data: {
            itemId: id,
            imageBytes: image.bytes,
            imageType: image.type,
            sortOrder: nextOrder + index,
          },
        }),
      ),
    ])
  } else {
    if (uploaded.images.length > MAX_IMAGES) {
      return { error: "Een tegel kan maximaal 8 afbeeldingen hebben." }
    }
    await prisma.shopItem.create({
      data: {
        description: parsed.data.description,
        quantity,
        priceCents,
        outOfStock,
        images: {
          create: uploaded.images.map((image, index) => ({
            imageBytes: image.bytes,
            imageType: image.type,
            sortOrder: index,
          })),
        },
      },
    })
  }

  revalidatePath("/winkel")
  return done(id ? "Tegel bijgewerkt." : "Tegel geplaatst.")
}

export async function deleteShopItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!admin) return { error: "Alleen beheerders kunnen een tegel verwijderen." }

  const id = String(formData.get("id") ?? "")
  const existing = await prisma.shopItem.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return { error: "Deze tegel bestaat niet meer." }

  await prisma.shopItem.delete({ where: { id } })
  revalidatePath("/winkel")
  return done("Tegel verwijderd.")
}
