import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getAvailabilityContext } from "@/lib/appointments/getAvailabilityContext";

const MIN_APPOINTMENT_MINUTES = 5;
const MAX_APPOINTMENT_MINUTES = 480;

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  return !Number.isNaN(parsedDate.getTime());
}

function parseAppointmentMinutes(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < MIN_APPOINTMENT_MINUTES ||
    parsedValue > MAX_APPOINTMENT_MINUTES
  ) {
    return null;
  }

  return parsedValue;
}

export async function GET(req: Request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "No autorizado",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    const url = new URL(req.url);

    const date = url.searchParams.get("date")?.trim() ?? "";

    const requestedMinutes = parseAppointmentMinutes(
      url.searchParams.get("appointmentMinutes"),
    );

    if (!isValidDate(date)) {
      return NextResponse.json(
        {
          error: "La fecha no es válida",
          code: "INVALID_DATE",
        },
        { status: 400 },
      );
    }

    if (requestedMinutes === null) {
      return NextResponse.json(
        {
          error: "La duración de la cita no es válida",
          code: "INVALID_APPOINTMENT_MINUTES",
        },
        { status: 400 },
      );
    }

    const availability = await getAvailabilityContext({
      clinicId: user.clinicId,
      date,
      appointmentMinutes: requestedMinutes,
      searchNextAvailableDate: true,
    });

    return NextResponse.json({
      date: availability.date,
      timezone: availability.timezone,
      appointmentMinutes: availability.appointmentMinutes,
      minimumBookingNoticeHours:
        availability.minimumBookingNoticeHours,

      status: availability.status,
      explanation: availability.explanation,

      availableSlots: availability.availableSlots.map((slot) => ({
        startAt: slot.startAtIso,
        endAt: slot.endAtIso,
        localDate: slot.localDate,
        localStartTime: slot.localStartTime,
        localEndTime: slot.localEndTime,
      })),

      total: availability.total,

      suggestion: availability.suggestedDate
        ? {
            date: availability.suggestedDate,
            startTime: availability.suggestedStartTime,
            endTime: availability.suggestedEndTime,
            startAt: availability.suggestedStartAtIso,
            endAt: availability.suggestedEndAtIso,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "GET_APPOINTMENT_AVAILABILITY_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error: "Error interno al consultar disponibilidad",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}