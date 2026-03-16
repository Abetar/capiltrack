// app/api/patients/[id]/route.ts
import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    )
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id,
      clinicId: user.clinicId,
    },
  })

  if (!patient) {
    return NextResponse.json(
      { error: "Paciente no encontrado" },
      { status: 404 }
    )
  }

  return NextResponse.json(patient)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    )
  }

  const body = await req.json()

  const {
    firstName,
    lastName,
    phone,
    email,
    birthDate,
    gender,
    notes,
  } = body

  if (!firstName || firstName.trim().length < 2) {
    return NextResponse.json(
      { error: "Nombre requerido" },
      { status: 400 }
    )
  }

  if (phone && !/^[0-9]+$/.test(phone)) {
    return NextResponse.json(
      { error: "El teléfono solo puede contener números" },
      { status: 400 }
    )
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "El email no tiene un formato válido" },
      { status: 400 }
    )
  }

  const existingPatient = await prisma.patient.findFirst({
    where: {
      id,
      clinicId: user.clinicId,
    },
  })

  if (!existingPatient) {
    return NextResponse.json(
      { error: "Paciente no encontrado" },
      { status: 404 }
    )
  }

  const updatedPatient = await prisma.patient.update({
    where: {
      id: existingPatient.id,
    },
    data: {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender?.trim() || null,
      notes: notes?.trim() || null,
    },
  })

  return NextResponse.json({
    success: true,
    patient: updatedPatient,
  })
}
