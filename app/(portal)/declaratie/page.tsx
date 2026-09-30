import { DeclarationDesk } from "@/components/declaration-desk"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Declaratie" }

export default async function DeclaratiePage() {
  const session = await auth()
  const isAdmin = session?.user.role === "ADMIN"
  const claims = isAdmin
    ? await prisma.declaration.findMany({
        orderBy: { createdAt: "desc" },
        omit: { imageBytes: true },
        include: { createdBy: { select: { name: true } } },
      })
    : []

  return (
    <DeclarationDesk
      isAdmin={isAdmin}
      claims={claims.map((claim) => ({
        id: claim.id,
        amountCents: claim.amountCents,
        reason: claim.reason,
        bankAccount: claim.bankAccount,
        accountName: claim.accountName,
        hasImage: Boolean(claim.imageType),
        createdByName: claim.createdBy.name,
        createdAt: claim.createdAt.toISOString(),
      }))}
    />
  )
}
