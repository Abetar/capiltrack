import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      clinic: true,
    },
  })

  if (!targetUser) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    )
  }

  // 🔥 NO PUEDES AFECTARTE A TI MISMO
  if (targetUser.id === currentUser.id) {
    return NextResponse.json(
      { error: "No puedes modificarte a ti mismo" },
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

  // 🔥 CANCELAR SUSCRIPCIÓN
  if (action === "cancel_subscription") {
    try {
      if (targetUser.stripeSubId) {
        // ⚠️ Intentar cancelar en Stripe (si existe)
        await stripe.subscriptions.cancel(targetUser.stripeSubId)
      }

      // 🔥 FIX CLAVE: limpiar estado
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          subscriptionStatus: "canceled",
          stripeSubId: null, // 💀 esto evita errores futuros
        },
      })

      return NextResponse.json({ success: true })

    } catch (error) {
      console.error("Error cancelando suscripción:", error)

      // 🔥 incluso si Stripe falla, el admin manda
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          subscriptionStatus: "canceled",
          stripeSubId: null,
        },
      })

      return NextResponse.json({ success: true })
    }
  }

  // 🔥 REACTIVAR (ADMIN OVERRIDE)
  if (action === "reactivate_subscription") {
    try {
      const user = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          subscriptionStatus: "active",
          isBlocked: false,
          // ⚠️ NO tocamos stripeSubId (queda null)
        },
      })

      return NextResponse.json({ success: true, user })

    } catch (error) {
      console.error("Error reactivando:", error)

      return NextResponse.json(
        { error: "Error reactivando usuario" },
        { status: 500 }
      )
    }
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