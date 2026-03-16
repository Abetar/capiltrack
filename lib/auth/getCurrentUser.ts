import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function getCurrentUser() {
  const session = await auth()

  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  })

  return user
}
