import { NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import { createAppointment } from "@/lib/appointments/createAppointment";

const DEFAULT_TIMEZONE = "America/Mexico_City";

type CreateAppointmentBody = {
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
};

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export async function POST(req: Request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      );
    }

    const body = (await req.json()) as CreateAppointmentBody;

    const patientId =
      typeof body.patientId === "string" && body.patientId.trim()
        ? body.patientId.trim()
        : null;

    const patientName =
      typeof body.patientName === "string"
        ? body.patientName.trim()
        : "";

    const patientPhone =
      typeof body.patientPhone === "string"
        ? body.patientPhone.trim()
        : "";

    const patientEmail =
      typeof body.patientEmail === "string" &&
      body.patientEmail.trim()
        ? body.patientEmail.trim()
        : null;

    const date =
      typeof body.date === "string"
        ? body.date.trim()
        : "";

    const startTime =
      typeof body.startTime === "string"
        ? body.startTime.trim()
        : "";

    if (!patientName) {
      return NextResponse.json(
        { error: "El nombre del paciente es obligatorio" },
        { status: 400 },
      );
    }

    if (!patientPhone) {
      return NextResponse.json(
        { error: "El teléfono del paciente es obligatorio" },
        { status: 400 },
      );
    }

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

    const scheduleSettings =
      await prisma.scheduleSettings.findUnique({
        where: {
          clinicId: user.clinicId,
        },
      });

    const timezone =
      scheduleSettings?.timezone ?? DEFAULT_TIMEZONE;

    const appointmentMinutes =
      Number.isInteger(body.appointmentMinutes) &&
      Number(body.appointmentMinutes) > 0
        ? Number(body.appointmentMinutes)
        : (scheduleSettings?.defaultAppointmentMinutes ?? 60);

    if (
      appointmentMinutes < 5 ||
      appointmentMinutes > 480
    ) {
      return NextResponse.json(
        { error: "La duración de la cita no es válida" },
        { status: 400 },
      );
    }

    const startAt = fromZonedTime(
      `${date}T${startTime}:00`,
      timezone,
    );

    const endAt = new Date(
      startAt.getTime() +
        appointmentMinutes * 60 * 1000,
    );

    const result = await createAppointment({
      clinicId: user.clinicId,
      patientId,
      actorUserId: user.id,
      patientName,
      patientPhone,
      patientEmail,
      startAt,
      endAt,
      timezone,
      appointmentType:
        typeof body.appointmentType === "string"
          ? body.appointmentType
          : null,
      title:
        typeof body.title === "string"
          ? body.title
          : null,
      notes:
        typeof body.notes === "string"
          ? body.notes
          : null,
      source: "MANUAL",
    });

    if (!result.success) {
      const messages = {
        INVALID_INTERVAL:
          "El intervalo de la cita no es válido",
        OUTSIDE_WORKING_HOURS:
          "El horario está fuera del horario laboral",
        OVERLAPS_APPOINTMENT:
          "El horario coincide con otra cita",
        OVERLAPS_SCHEDULE_BLOCK:
          "El horario está bloqueado",
        PATIENT_NOT_FOUND:
          "El paciente seleccionado no existe",
      };

      return NextResponse.json(
        {
          error: messages[result.error],
          code: result.error,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        appointment: result.appointment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_APPOINTMENT_ERROR", error);

    return NextResponse.json(
      { error: "Error interno al crear la cita" },
      { status: 500 },
    );
  }
}