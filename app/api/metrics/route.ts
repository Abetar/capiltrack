import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user } = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      consultationId,
      density,
      thickness,
      zone,
      notes,
    } = body;

    if (!consultationId) {
      return NextResponse.json(
        { error: "consultationId es requerido" },
        { status: 400 }
      );
    }

    // verificar que la consulta pertenece a la clínica

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        clinicId: user.clinicId,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: "Consulta no encontrada" },
        { status: 404 }
      );
    }

    const metric = await prisma.hairMetric.create({
      data: {
        clinicId: user.clinicId,
        patientId: consultation.patientId,
        consultationId: consultation.id,
        density: density ?? null,
        thickness: thickness ?? null,
        zone: zone ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(metric);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error creando métricas" },
      { status: 500 }
    );
  }
}