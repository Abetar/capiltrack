import { prisma } from "@/lib/db/prisma";
import { validateAppointmentSlot } from "./validateAppointmentSlot";

type CreateAppointmentInput = {
  clinicId: string;

  patientId?: string | null;
  actorUserId?: string | null;

  title?: string | null;

  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;

  startAt: Date;
  endAt: Date;

  timezone?: string;

  appointmentType?: string | null;
  notes?: string | null;

  source?: "MANUAL" | "WHATSAPP_AI";
};

export type CreateAppointmentResult =
  | {
      success: true;
      appointment: Awaited<
        ReturnType<typeof prisma.appointment.create>
      >;
      error: null;
    }
  | {
      success: false;
      appointment: null;
      error:
        | "INVALID_INTERVAL"
        | "OUTSIDE_WORKING_HOURS"
        | "OVERLAPS_APPOINTMENT"
        | "OVERLAPS_SCHEDULE_BLOCK"
        | "PATIENT_NOT_FOUND";
    };

export async function createAppointment({
  clinicId,
  patientId,
  actorUserId,
  title,
  patientName,
  patientPhone,
  patientEmail,
  startAt,
  endAt,
  timezone = "America/Mexico_City",
  appointmentType,
  notes,
  source = "MANUAL",
}: CreateAppointmentInput): Promise<CreateAppointmentResult> {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!patientName.trim()) {
    throw new Error("patientName is required");
  }

  if (!patientPhone.trim()) {
    throw new Error("patientPhone is required");
  }

  if (patientId) {
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        clinicId,
      },
      select: {
        id: true,
      },
    });

    if (!patient) {
      return {
        success: false,
        appointment: null,
        error: "PATIENT_NOT_FOUND",
      };
    }
  }

  if (actorUserId) {
    const actorUser = await prisma.user.findFirst({
      where: {
        id: actorUserId,
        clinicId,
      },
      select: {
        id: true,
      },
    });

    if (!actorUser) {
      throw new Error(
        "actorUserId does not belong to the appointment clinic",
      );
    }
  }

  const validation = await validateAppointmentSlot({
    clinicId,
    startAt,
    endAt,
  });

  if (!validation.isAvailable) {
    return {
      success: false,
      appointment: null,
      error: validation.reason,
    };
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const createdAppointment = await tx.appointment.create({
      data: {
        clinicId,
        patientId: patientId ?? null,
        title: title?.trim() || null,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail?.trim() || null,
        startAt,
        endAt,
        timezone,
        appointmentType: appointmentType?.trim() || null,
        notes: notes?.trim() || null,
        source,
        status: "PENDING",
      },
    });

    await tx.appointmentEvent.create({
      data: {
        clinicId,
        appointmentId: createdAppointment.id,
        actorUserId: actorUserId ?? null,
        type: "CREATED",
        source:
          source === "WHATSAPP_AI"
            ? "WHATSAPP_AI"
            : "MANUAL",
        message:
          source === "WHATSAPP_AI"
            ? `La cita de ${createdAppointment.patientName} fue creada mediante el agente de WhatsApp.`
            : `La cita de ${createdAppointment.patientName} fue creada manualmente.`,
        metadata: {
          patientId: createdAppointment.patientId,
          startAt: createdAppointment.startAt.toISOString(),
          endAt: createdAppointment.endAt.toISOString(),
          timezone: createdAppointment.timezone,
          appointmentType:
            createdAppointment.appointmentType,
          status: createdAppointment.status,
        },
      },
    });

    return createdAppointment;
  });

  return {
    success: true,
    appointment,
    error: null,
  };
}