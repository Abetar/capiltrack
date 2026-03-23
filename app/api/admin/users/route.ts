import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    )
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Sin permisos" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { targetUserId, action } = body

  if (!targetUserId || !action) {
    return NextResponse.json(
      { error: "Datos incompletos" },
      { status: 400 }
    )
  }

  // 🔥 BLOQUEAR
  if (action === "block") {
    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { isBlocked: true },
    })

    return NextResponse.json({ success: true, user })
  }

  // 🔥 DESBLOQUEAR
  if (action === "unblock") {
    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { isBlocked: false },
    })

    return NextResponse.json({ success: true, user })
  }

  // 🔥 ELIMINAR USUARIO
  if (action === "delete") {
    await prisma.user.delete({
      where: { id: targetUserId },
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { error: "Acción inválida" },
    { status: 400 }
  )
}