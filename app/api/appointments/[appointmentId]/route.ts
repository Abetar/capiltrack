import { NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import { validateAppointmentSlot } from "@/lib/appointments/validateAppointmentSlot";

const DEFAULT_TIMEZONE = "America/Mexico_City";

const VALID_APPOINTMENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
] as const;

type AppointmentStatusValue =
  (typeof VALID_APPOINTMENT_STATUSES)[number];

type UpdateAppointmentBody = {
  patientId?: string | null;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string | null;
  date?: string;
  startTime?: string;
  appointmentMinutes?: number;
  appointmentType?: string | null;
  title?: string | null;
  notes?: string | null;
  status?: AppointmentStatusValue;
};

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidAppointmentStatus(
  value: unknown,
): value is AppointmentStatusValue {
  return VALID_APPOINTMENT_STATUSES.includes(
    value as AppointmentStatusValue,
  );
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      appointmentId: string;
    }>;
  },
) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      );
    }

    const { appointmentId } = await params;
    const body = (await req.json()) as UpdateAppointmentBody;

    if (
      body.status !== undefined &&
      !isValidAppointmentStatus(body.status)
    ) {
      return NextResponse.json(
        { error: "El estado de la cita no es válido" },
        { status: 400 },
      );
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        clinicId: user.clinicId,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 },
      );
    }

    const settings =
      await prisma.scheduleSettings.findUnique({
        where: {
          clinicId: user.clinicId,
        },
      });

    const timezone =
      settings?.timezone ??
      appointment.timezone ??
      DEFAULT_TIMEZONE;

    const nextPatientId =
      typeof body.patientId === "string" &&
      body.patientId.trim()
        ? body.patientId.trim()
        : body.patientId === null
          ? null
          : appointment.patientId;

    const nextPatientName =
      typeof body.patientName === "string"
        ? body.patientName.trim()
        : appointment.patientName;

    const nextPatientPhone =
      typeof body.patientPhone === "string"
        ? body.patientPhone.trim()
        : appointment.patientPhone;

    const nextPatientEmail =
      typeof body.patientEmail === "string"
        ? body.patientEmail.trim() || null
        : body.patientEmail === null
          ? null
          : appointment.patientEmail;

    if (!nextPatientName) {
      return NextResponse.json(
        { error: "El nombre del paciente es obligatorio" },
        { status: 400 },
      );
    }

    if (!nextPatientPhone) {
      return NextResponse.json(
        { error: "El teléfono del paciente es obligatorio" },
        { status: 400 },
      );
    }

    if (nextPatientId) {
      const patient = await prisma.patient.findFirst({
        where: {
          id: nextPatientId,
          clinicId: user.clinicId,
        },
        select: {
          id: true,
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "El paciente seleccionado no existe" },
          { status: 404 },
        );
      }
    }

    let nextStartAt = appointment.startAt;
    let nextEndAt = appointment.endAt;

    const hasDateOrTimeInput =
      typeof body.date === "string" ||
      typeof body.startTime === "string" ||
      typeof body.appointmentMinutes === "number";

    if (hasDateOrTimeInput) {
      const currentDate =
        appointment.startAt.toLocaleDateString("en-CA", {
          timeZone: timezone,
        });

      const currentStartTime =
        appointment.startAt.toLocaleTimeString("en-GB", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

      const date =
        typeof body.date === "string"
          ? body.date.trim()
          : currentDate;

      const startTime =
        typeof body.startTime === "string"
          ? body.startTime.trim()
          : currentStartTime;

      if (!isValidDate(date)) {
        return NextResponse.json(
          { error: "La fecha no es válida" },
          { status: 400 },
        );
      }

      if (!isValidTime(startTime)) {
        return NextResponse.json(
          { error: "La hora no es válida" },
          { status: 400 },
        );
      }

      const appointmentMinutes =
        Number.isInteger(body.appointmentMinutes) &&
        Number(body.appointmentMinutes) > 0
          ? Number(body.appointmentMinutes)
          : Math.round(
              (appointment.endAt.getTime() -
                appointment.startAt.getTime()) /
                60000,
            );

      if (
        appointmentMinutes < 5 ||
        appointmentMinutes > 480
      ) {
        return NextResponse.json(
          { error: "La duración de la cita no es válida" },
          { status: 400 },
        );
      }

      nextStartAt = fromZonedTime(
        `${date}T${startTime}:00`,
        timezone,
      );

      nextEndAt = new Date(
        nextStartAt.getTime() +
          appointmentMinutes * 60 * 1000,
      );

      const scheduleActuallyChanged =
        nextStartAt.getTime() !==
          appointment.startAt.getTime() ||
        nextEndAt.getTime() !==
          appointment.endAt.getTime();

      if (scheduleActuallyChanged) {
        const validation = await validateAppointmentSlot({
          clinicId: user.clinicId,
          startAt: nextStartAt,
          endAt: nextEndAt,
          excludeAppointmentId: appointment.id,
        });

        if (!validation.isAvailable) {
          const messages = {
            INVALID_INTERVAL:
              "El intervalo de la cita no es válido",
            OUTSIDE_WORKING_HOURS:
              "El horario está fuera del horario laboral",
            OVERLAPS_APPOINTMENT:
              "El horario coincide con otra cita",
            OVERLAPS_SCHEDULE_BLOCK:
              "El horario está bloqueado",
          };

          return NextResponse.json(
            {
              error: messages[validation.reason],
              code: validation.reason,
            },
            { status: 409 },
          );
        }
      }
    }

    const nextStatus =
      body.status ?? appointment.status;

    const scheduleChanged =
      nextStartAt.getTime() !==
        appointment.startAt.getTime() ||
      nextEndAt.getTime() !==
        appointment.endAt.getTime();

    const statusChanged =
      nextStatus !== appointment.status;

    const now = new Date();

    const updatedAppointment =
      await prisma.$transaction(async (tx) => {
        const updated = await tx.appointment.update({
          where: {
            id: appointment.id,
          },
          data: {
            patientId: nextPatientId,
            patientName: nextPatientName,
            patientPhone: nextPatientPhone,
            patientEmail: nextPatientEmail,
            startAt: nextStartAt,
            endAt: nextEndAt,
            timezone,
            appointmentType:
              typeof body.appointmentType === "string"
                ? body.appointmentType.trim() || null
                : body.appointmentType === null
                  ? null
                  : appointment.appointmentType,
            title:
              typeof body.title === "string"
                ? body.title.trim() || null
                : body.title === null
                  ? null
                  : appointment.title,
            notes:
              typeof body.notes === "string"
                ? body.notes.trim() || null
                : body.notes === null
                  ? null
                  : appointment.notes,
            status: nextStatus,
            confirmedAt:
              nextStatus === "CONFIRMED" &&
              appointment.status !== "CONFIRMED"
                ? now
                : appointment.confirmedAt,
            cancelledAt:
              nextStatus === "CANCELLED"
                ? now
                : body.status !== undefined
                  ? null
                  : appointment.cancelledAt,
          },
        });

        if (scheduleChanged) {
          await tx.appointmentEvent.create({
            data: {
              clinicId: user.clinicId,
              appointmentId: appointment.id,
              actorUserId: user.id,
              type: "RESCHEDULED",
              source: "MANUAL",
              message: `La cita de ${updated.patientName} fue reagendada manualmente.`,
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
        }

        if (statusChanged) {
          if (nextStatus === "CONFIRMED") {
            await tx.appointmentEvent.create({
              data: {
                clinicId: user.clinicId,
                appointmentId: appointment.id,
                actorUserId: user.id,
                type: "CONFIRMED",
                source: "MANUAL",
                message: `La cita de ${updated.patientName} fue confirmada manualmente.`,
                metadata: {
                  previousStatus: appointment.status,
                  nextStatus,
                },
              },
            });
          }

          if (nextStatus === "CANCELLED") {
            await tx.appointmentEvent.create({
              data: {
                clinicId: user.clinicId,
                appointmentId: appointment.id,
                actorUserId: user.id,
                type: "CANCELLED",
                source: "MANUAL",
                message: `La cita de ${updated.patientName} fue cancelada manualmente.`,
                metadata: {
                  previousStatus: appointment.status,
                  nextStatus,
                  startAt: updated.startAt.toISOString(),
                  endAt: updated.endAt.toISOString(),
                },
              },
            });
          }

          if (nextStatus === "COMPLETED") {
            await tx.appointmentEvent.create({
              data: {
                clinicId: user.clinicId,
                appointmentId: appointment.id,
                actorUserId: user.id,
                type: "COMPLETED",
                source: "MANUAL",
                message: `La cita de ${updated.patientName} fue marcada como completada.`,
                metadata: {
                  previousStatus: appointment.status,
                  nextStatus,
                },
              },
            });
          }

          if (nextStatus === "NO_SHOW") {
            await tx.appointmentEvent.create({
              data: {
                clinicId: user.clinicId,
                appointmentId: appointment.id,
                actorUserId: user.id,
                type: "NO_SHOW",
                source: "MANUAL",
                message: `La cita de ${updated.patientName} fue marcada como inasistencia.`,
                metadata: {
                  previousStatus: appointment.status,
                  nextStatus,
                },
              },
            });
          }
        }

        return updated;
      });

    return NextResponse.json({
      ok: true,
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error(
      "UPDATE_APPOINTMENT_ERROR",
      error,
    );

    return NextResponse.json(
      { error: "Error interno al actualizar la cita" },
      { status: 500 },
    );
  }
}