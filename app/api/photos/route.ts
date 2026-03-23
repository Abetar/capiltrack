import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

export async function POST(req: Request) {

  const { user } = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    )
  }

  const body = await req.json()

  const {
    patientId,
    consultationId,
    url,
    zone,
    notes
  } = body

  if (!patientId || !url) {
    return NextResponse.json(
      { error: "Datos incompletos" },
      { status: 400 }
    )
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      clinicId: user.clinicId
    }
  })

  if (!patient) {
    return NextResponse.json(
      { error: "Paciente no encontrado" },
      { status: 404 }
    )
  }

  const photo = await prisma.photo.create({
    data: {
      clinicId: user.clinicId,
      patientId,
      consultationId,
      url,
      zone,
      notes
    }
  })

  return NextResponse.json({
    success: true,
    photo
  })
}
