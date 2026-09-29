import { UserManager } from "@/components/user-manager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Beheer" }

export default async function AdminPage() {
  const session = await auth()
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  return (
    <UserManager
      currentUserId={session?.user.id ?? ""}
      users={users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      }))}
    />
  )
}
