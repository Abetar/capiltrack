import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id: patientId } = await params

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    if (!patientId) {
      return NextResponse.json(
        { error: "Paciente requerido" },
        { status: 400 }
      )
    }

    const consultations = await prisma.consultation.findMany({
      where: {
        patientId: patientId,
        clinicId: user.clinicId
      },
      orderBy: {
        date: "desc"
      },
      take: 5,
      select: {
        id: true,
        date: true,
        norwoodLevel: true,
        notes: true
      }
    })

    return NextResponse.json({
      consultations
    })

  } catch (error) {

    console.error("Get consultations error:", error)

    return NextResponse.json(
      { error: "Error interno obteniendo consultas" },
      { status: 500 }
    )

  }
}