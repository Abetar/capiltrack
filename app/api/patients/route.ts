import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"

export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    )
  }

  const patients = await prisma.patient.findMany({
    where: {
      clinicId: user.clinicId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return NextResponse.json(patients)
}

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    )
  }

  const body = await req.json()

  const {
    firstName,
    lastName,
    phone,
    email,
  } = body

  if (!firstName) {
    return NextResponse.json(
      { error: "Nombre requerido" },
      { status: 400 }
    )
  }

  const patient = await prisma.patient.create({
    data: {
      firstName,
      lastName,
      phone,
      email,
      clinicId: user.clinicId,
    },
  })

  return NextResponse.json(patient)
}