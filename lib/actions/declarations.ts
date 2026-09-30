"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { inspectImage, prismaBytes, sniffImageMime } from "@/lib/files"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/types"
import { declarationAmountCents, declarationSchema, issueMessage } from "@/lib/validators"

function done(message: string): ActionState {
  return { message, nonce: Date.now() }
}

export async function submitDeclaration(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user) return { error: "Log in om een declaratie in te dienen." }

  const parsed = declarationSchema.safeParse({
    amount: formData.get("amount"),
    reason: formData.get("reason"),
    bankAccount: formData.get("bankAccount"),
    accountName: formData.get("accountName"),
  })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  const amountCents = declarationAmountCents(parsed.data.amount)
  if (amountCents == null) return { error: "Vul een bedrag in, bijvoorbeeld 12,50." }

  const image = formData.get("image")
  let imageBytes: Uint8Array<ArrayBuffer> | undefined
  let imageType: string | undefined
  if (image instanceof File && image.size > 0) {
    const inspected = inspectImage(image)
    if (inspected.error) return { error: inspected.error }
    const bytes = prismaBytes(new Uint8Array(await image.arrayBuffer()))
    imageType = sniffImageMime(bytes, image.type || "application/octet-stream")
    if (!imageType.startsWith("image/")) return { error: "Gebruik een JPG-, PNG- of WebP-bestand." }
    imageBytes = bytes
  }

  await prisma.declaration.create({
    data: {
      amountCents,
      reason: parsed.data.reason,
      bankAccount: parsed.data.bankAccount,
      accountName: parsed.data.accountName,
      imageBytes,
      imageType,
      createdById: session.user.id,
    },
  })

  revalidatePath("/declaratie")
  return done("Je declaratie is ingediend.")
}
