import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

type AuthResult =
  | { user: any; reason: null }
  | { user: null; reason: "not_authenticated" | "not_found" | "blocked" | "no_subscription" }

export async function getCurrentUser(): Promise<AuthResult> {
  const session = await auth()

  if (!session?.user?.email) {
    return { user: null, reason: "not_authenticated" }
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  })

  if (!user) {
    return { user: null, reason: "not_found" }
  }

  if (user.isBlocked) {
    return { user: null, reason: "blocked" }
  }

  if (user.subscriptionStatus !== "active") {
    return { user: null, reason: "no_subscription" }
  }

  return { user, reason: null }
}