import type {
  AppointmentEventSource,
  AppointmentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { validateAppointmentSlot } from "./validateAppointmentSlot";

type RescheduleAppointmentInput = {
  clinicId: string;
  appointmentId: string;

  startAt: Date;
  endAt: Date;
  timezone: string;

  source: AppointmentEventSource;

  actorUserId?: string | null;
  message?: string;
};

export type RescheduleAppointmentResult =
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
      };
    }
  | {
      success: false;
      reason:
        | "NOT_FOUND"
        | "ALREADY_CANCELLED"
        | "COMPLETED"
        | "NO_SHOW"
        | "INVALID_INTERVAL"
        | "OUTSIDE_WORKING_HOURS"
        | "OVERLAPS_APPOINTMENT"
        | "OVERLAPS_SCHEDULE_BLOCK";
    };

export async function rescheduleAppointment({
  clinicId,
  appointmentId,
  startAt,
  endAt,
  timezone,
  source,
  actorUserId = null,
  message,
}: RescheduleAppointmentInput): Promise<RescheduleAppointmentResult> {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!appointmentId.trim()) {
    throw new Error("appointmentId is required");
  }

  if (!timezone.trim()) {
    throw new Error("timezone is required");
  }

  if (
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime())
  ) {
    return {
      success: false,
      reason: "INVALID_INTERVAL",
    };
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

  const validation = await validateAppointmentSlot({
    clinicId,
    startAt,
    endAt,
    excludeAppointmentId: appointment.id,
  });

  if (!validation.isAvailable) {
    return {
      success: false,
      reason: validation.reason,
    };
  }

  const scheduleChanged =
    startAt.getTime() !== appointment.startAt.getTime() ||
    endAt.getTime() !== appointment.endAt.getTime();

  if (!scheduleChanged) {
    return {
      success: true,
      appointment,
    };
  }

  const updatedAppointment = await prisma.$transaction(
    async (tx) => {
      const updated = await tx.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          startAt,
          endAt,
          timezone,
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
        },
      });

      await tx.appointmentEvent.create({
        data: {
          clinicId,
          appointmentId: appointment.id,
          actorUserId,
          type: "RESCHEDULED",
          source,
          message:
            message ??
            `La cita de ${updated.patientName} fue reagendada.`,
          metadata: {
            previousStartAt:
              appointment.startAt.toISOString(),
            previousEndAt:
              appointment.endAt.toISOString(),
            nextStartAt:
              updated.startAt.toISOString(),
            nextEndAt:
              updated.endAt.toISOString(),
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