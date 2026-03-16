import { prisma } from "@/lib/db/prisma"
import { randomBytes } from "crypto"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json(
      { error: "Debes ingresar un correo." },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return NextResponse.json(
      { error: "No existe una cuenta con ese correo." },
      { status: 404 }
    )
  }

  const token = randomBytes(32).toString("hex")

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  })

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  return NextResponse.json({
    success: true,
    resetUrl,
  })
}