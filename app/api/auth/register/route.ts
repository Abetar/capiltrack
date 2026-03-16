import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  const body = await req.json()

  const { name, email, password, clinicName } = body

  if (!name || !email || !password || !clinicName) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const clinic = await prisma.clinic.create({
    data: {
      name: clinicName
    }
  })

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      clinicId: clinic.id
    }
  })

  return NextResponse.json({
    success: true,
    user
  })
}