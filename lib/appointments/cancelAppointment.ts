import type {
  AppointmentEventSource,
  AppointmentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type CancelAppointmentInput = {
  clinicId: string;
  appointmentId: string;

  source: AppointmentEventSource;

  actorUserId?: string | null;
  message?: string;
};

export type CancelAppointmentResult =
  | {
      success: true;
      appointment: {
        id: string;
        clinicId: string;
        patientName: string;
        patientPhone: string;
        startAt: Date;
        endAt: Date;
        timezone: string;
        status: AppointmentStatus;
        cancelledAt: Date | null;
      };
    }
  | {
      success: false;
      reason:
        | "NOT_FOUND"
        | "ALREADY_CANCELLED"
        | "COMPLETED"
        | "NO_SHOW";
    };

export async function cancelAppointment({
  clinicId,
  appointmentId,
  source,
  actorUserId = null,
  message,
}: CancelAppointmentInput): Promise<CancelAppointmentResult> {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!appointmentId.trim()) {
    throw new Error("appointmentId is required");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      clinicId,
    },
    select: {
      id: true,
      clinicId: true,
      patientName: true,
      patientPhone: true,
      startAt: true,
      endAt: true,
      timezone: true,
      status: true,
      cancelledAt: true,
    },
  });

  if (!appointment) {
    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }

  if (appointment.status === "CANCELLED") {
    return {
      success: false,
      reason: "ALREADY_CANCELLED",
    };
  }

  if (appointment.status === "COMPLETED") {
    return {
      success: false,
      reason: "COMPLETED",
    };
  }

  if (appointment.status === "NO_SHOW") {
    return {
      success: false,
      reason: "NO_SHOW",
    };
  }

  const now = new Date();

  const updatedAppointment = await prisma.$transaction(
    async (tx) => {
      const updated = await tx.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
        },
        select: {
          id: true,
          clinicId: true,
          patientName: true,
          patientPhone: true,
          startAt: true,
          endAt: true,
          timezone: true,
          status: true,
          cancelledAt: true,
        },
      });

      await tx.appointmentEvent.create({
        data: {
          clinicId,
          appointmentId: appointment.id,
          actorUserId,
          type: "CANCELLED",
          source,
          message:
            message ??
            `La cita de ${updated.patientName} fue cancelada.`,
          metadata: {
            previousStatus: appointment.status,
            nextStatus: "CANCELLED",
            startAt: updated.startAt.toISOString(),
            endAt: updated.endAt.toISOString(),
            timezone: updated.timezone,
          },
        },
      });

      return updated;
    },
  );

  return {
    success: true,
    appointment: updatedAppointment,
  };
}