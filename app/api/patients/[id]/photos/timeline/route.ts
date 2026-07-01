import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextResponse } from "next/server";

type TimelinePhotoUpdate = {
  id: string;
  timelineOrder?: number | null;
  timelineLabel?: string | null;
  excludeFromTimeline?: boolean;
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: patientId } = await params;

  const { user } = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const updates = body.updates as TimelinePhotoUpdate[] | undefined;

  if (!Array.isArray(updates)) {
    return NextResponse.json(
      { error: "Formato inválido" },
      { status: 400 },
    );
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      clinicId: user.clinicId,
    },
    select: {
      id: true,
    },
  });

  if (!patient) {
    return NextResponse.json(
      { error: "Paciente no encontrado" },
      { status: 404 },
    );
  }

  await prisma.$transaction(
    updates.map((photo) =>
      prisma.photo.updateMany({
        where: {
          id: photo.id,
          patientId,
          clinicId: user.clinicId,
        },
        data: {
          timelineOrder:
            typeof photo.timelineOrder === "number"
              ? photo.timelineOrder
              : null,
          timelineLabel: photo.timelineLabel?.trim() || null,
          excludeFromTimeline: Boolean(photo.excludeFromTimeline),
        },
      }),
    ),
  );

  return NextResponse.json({
    success: true,
  });
}