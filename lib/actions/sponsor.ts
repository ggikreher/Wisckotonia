"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { inspectImage, prismaBytes, sniffImageMime } from "@/lib/files"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/types"
import { issueMessage, sponsorLinkSchema } from "@/lib/validators"

const SPONSOR_ID = "default"

function done(message: string): ActionState {
  return { message, nonce: Date.now() }
}

export async function saveSponsorLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (session?.user.role !== "ADMIN") return { error: "Alleen beheerders kunnen deze afbeelding plaatsen." }

  const parsed = sponsorLinkSchema.safeParse({ url: formData.get("url") ?? "" })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  const image = formData.get("image")
  let imageBytes: Uint8Array<ArrayBuffer> | undefined
  let imageType: string | undefined
  if (image instanceof File && image.size > 0) {
    const inspected = inspectImage(image)
    if (inspected.error) return { error: inspected.error }
    const bytes = prismaBytes(new Uint8Array(await image.arrayBuffer()))
    imageType = sniffImageMime(bytes, image.type || "application/octet-stream")
    if (!imageType.startsWith("image/") || imageType === "image/svg+xml") {
      return { error: "Gebruik een JPG-, PNG- of WebP-bestand." }
    }
    imageBytes = bytes
  }

  const existing = await prisma.sponsorLink.findUnique({
    where: { id: SPONSOR_ID },
    select: { imageType: true },
  })
  if (!existing?.imageType && !imageBytes) return { error: "Kies een afbeelding." }

  await prisma.sponsorLink.upsert({
    where: { id: SPONSOR_ID },
    create: {
      id: SPONSOR_ID,
      url: parsed.data.url,
      imageBytes,
      imageType,
    },
    update: {
      url: parsed.data.url,
      ...(imageBytes ? { imageBytes, imageType } : {}),
    },
  })

  revalidatePath("/", "layout")
  return done("Afbeelding geplaatst.")
}
