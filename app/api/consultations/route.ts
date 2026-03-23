import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

export async function POST(req: Request) {

  try {

    // 🔥 FIX
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
      date,
      norwoodLevel,
      notes
    } = body

    if (!patientId) {
      return NextResponse.json(
        { error: "Paciente requerido" },
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

    const consultation = await prisma.consultation.create({
      data: {
        clinicId: user.clinicId,
        patientId: patient.id,
        date: date ? new Date(date) : new Date(),
        norwoodLevel: norwoodLevel ? Number(norwoodLevel) : null,
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json({
      success: true,
      consultation
    })

  } catch (error) {

    console.error("Create consultation error:", error)

    return NextResponse.json(
      { error: "Error interno creando consulta" },
      { status: 500 }
    )

  }

}