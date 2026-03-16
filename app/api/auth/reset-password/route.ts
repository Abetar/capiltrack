import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    console.log("TOKEN RECIBIDO:", token)

    if (!token || !password) {
      return NextResponse.json(
        { error: "Datos incompletos." },
        { status: 400 }
      )
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    console.log("TOKEN EN DB:", record)

    if (!record) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400 }
      )
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "El token ha expirado." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: record.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { email: record.email },
      data: {
        password: hashedPassword,
      },
    })

    await prisma.passwordResetToken.delete({
      where: { token },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error)

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}