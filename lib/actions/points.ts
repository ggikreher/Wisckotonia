"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { ActionState, PointsChoice } from "@/lib/types"
import { issueMessage, pointsChoiceSchema } from "@/lib/validators"

export async function savePointsChoice(
  memberId: string,
  choice: string,
  followUp: string,
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user) return { error: "Log opnieuw in om dit op te slaan." }

  const parsed = pointsChoiceSchema.safeParse({ choice, followUp })
  if (!parsed.success) return { error: issueMessage(parsed.error) }

  const existing = await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } })
  if (!existing) return { error: "Dit lid bestaat niet meer." }

  const pointsChoice = (parsed.data.choice || null) as PointsChoice | null
  const pointsFollowUp = pointsChoice === "WHISKY_ARTIKEL" ? parsed.data.followUp : ""

  await prisma.member.update({
    where: { id: memberId },
    data: { pointsChoice, pointsFollowUp },
  })
  revalidatePath("/punten")
  return { message: "Opgeslagen" }
}
