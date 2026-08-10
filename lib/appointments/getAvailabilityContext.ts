import { addDays, addMinutes, isAfter, isEqual } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db/prisma";
import {
  getAvailableSlots,
  type AvailableSlot,
} from "./getAvailableSlots";

const DEFAULT_TIMEZONE = "America/Mexico_City";
const DEFAULT_APPOINTMENT_MINUTES = 60;
const DEFAULT_MINIMUM_BOOKING_NOTICE_HOURS = 2;

const NEXT_AVAILABLE_DATE_SEARCH_DAYS = 30;
const MINIMUM_DIAGNOSTIC_SLOT_MINUTES = 15;

export type AvailabilityStatus =
  | "AVAILABLE"
  | "TODAY_FINISHED"
  | "PAST_DATE"
  | "NON_WORKING_DAY"
  | "DAY_FULL"
  | "NO_CONTINUOUS_SPACE";

type GetAvailabilityContextInput = {
  clinicId: string;
  date: string;
  appointmentMinutes?: number;
  now?: Date;
  searchNextAvailableDate?: boolean;
};

export type AvailabilitySuggestion = {
  date: string;
  startTime: string;
  endTime: string;
  startAtIso: string;
  endAtIso: string;
};

export type AvailabilityContext = {
  date: string;
  timezone: string;
  appointmentMinutes: number;
  minimumBookingNoticeHours: number;

  status: AvailabilityStatus;
  explanation: string;

  availableSlots: AvailableSlot[];
  total: number;

  suggestedDate: string | null;
  suggestedStartTime: string | null;
  suggestedEndTime: string | null;
  suggestedStartAtIso: string | null;
  suggestedEndAtIso: string | null;
};

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  return !Number.isNaN(parsedDate.getTime());
}

function getDayOfWeek(date: string, timezone: string) {
  const localMidday = fromZonedTime(`${date}T12:00:00`, timezone);

  return Number(formatInTimeZone(localMidday, timezone, "i")) % 7;
}

async function findNextAvailableSlot({
  clinicId,
  date,
  appointmentMinutes,
  now,
}: {
  clinicId: string;
  date: string;
  appointmentMinutes: number;
  now: Date;
}): Promise<AvailabilitySuggestion | null> {
  const selectedDate = new Date(`${date}T12:00:00`);

  for (
    let offset = 1;
    offset <= NEXT_AVAILABLE_DATE_SEARCH_DAYS;
    offset += 1
  ) {
    const candidateDate = formatInTimeZone(
      addDays(selectedDate, offset),
      "UTC",
      "yyyy-MM-dd",
    );

    const candidateSlots = await getAvailableSlots({
      clinicId,
      date: candidateDate,
      appointmentMinutes,
      now,
    });

    const firstSlot = candidateSlots[0];

    if (!firstSlot) {
      continue;
    }

    return {
      date: firstSlot.localDate,
      startTime: firstSlot.localStartTime,
      endTime: firstSlot.localEndTime,
      startAtIso: firstSlot.startAtIso,
      endAtIso: firstSlot.endAtIso,
    };
  }

  return null;
}

function buildContext({
  date,
  timezone,
  appointmentMinutes,
  minimumBookingNoticeHours,
  status,
  explanation,
  availableSlots,
  suggestion,
}: {
  date: string;
  timezone: string;
  appointmentMinutes: number;
  minimumBookingNoticeHours: number;
  status: AvailabilityStatus;
  explanation: string;
  availableSlots: AvailableSlot[];
  suggestion: AvailabilitySuggestion | null;
}): AvailabilityContext {
  return {
    date,
    timezone,
    appointmentMinutes,
    minimumBookingNoticeHours,

    status,
    explanation,

    availableSlots,
    total: availableSlots.length,

    suggestedDate: suggestion?.date ?? null,
    suggestedStartTime: suggestion?.startTime ?? null,
    suggestedEndTime: suggestion?.endTime ?? null,
    suggestedStartAtIso: suggestion?.startAtIso ?? null,
    suggestedEndAtIso: suggestion?.endAtIso ?? null,
  };
}

export async function getAvailabilityContext({
  clinicId,
  date,
  appointmentMinutes,
  now = new Date(),
  searchNextAvailableDate = true,
}: GetAvailabilityContextInput): Promise<AvailabilityContext> {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!isValidDateString(date)) {
    throw new Error("date must use YYYY-MM-DD format");
  }

  const settings = await prisma.scheduleSettings.findUnique({
    where: {
      clinicId,
    },
    select: {
      timezone: true,
      defaultAppointmentMinutes: true,
      minimumBookingNoticeHours: true,
    },
  });

  const timezone = settings?.timezone ?? DEFAULT_TIMEZONE;

  const resolvedAppointmentMinutes =
    appointmentMinutes ??
    settings?.defaultAppointmentMinutes ??
    DEFAULT_APPOINTMENT_MINUTES;

  const minimumBookingNoticeHours =
    settings?.minimumBookingNoticeHours ??
    DEFAULT_MINIMUM_BOOKING_NOTICE_HOURS;

  if (
    !Number.isInteger(resolvedAppointmentMinutes) ||
    resolvedAppointmentMinutes <= 0
  ) {
    throw new Error("appointmentMinutes must be a positive integer");
  }

  const today = formatInTimeZone(now, timezone, "yyyy-MM-dd");

  if (date < today) {
    return buildContext({
      date,
      timezone,
      appointmentMinutes: resolvedAppointmentMinutes,
      minimumBookingNoticeHours,
      status: "PAST_DATE",
      explanation:
        "La fecha seleccionada ya pasó. Selecciona una fecha futura.",
      availableSlots: [],
      suggestion: null,
    });
  }

  const dayOfWeek = getDayOfWeek(date, timezone);

  const availabilities = await prisma.scheduleAvailability.findMany({
    where: {
      clinicId,
      dayOfWeek,
      isActive: true,
    },
    select: {
      startTime: true,
      endTime: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (availabilities.length === 0) {
    const suggestion = searchNextAvailableDate
      ? await findNextAvailableSlot({
          clinicId,
          date,
          appointmentMinutes: resolvedAppointmentMinutes,
          now,
        })
      : null;

    return buildContext({
      date,
      timezone,
      appointmentMinutes: resolvedAppointmentMinutes,
      minimumBookingNoticeHours,
      status: "NON_WORKING_DAY",
      explanation:
        "La clínica no tiene horario laboral configurado para este día.",
      availableSlots: [],
      suggestion,
    });
  }

  const availableSlots = await getAvailableSlots({
    clinicId,
    date,
    appointmentMinutes: resolvedAppointmentMinutes,
    now,
  });

  if (availableSlots.length > 0) {
    return buildContext({
      date,
      timezone,
      appointmentMinutes: resolvedAppointmentMinutes,
      minimumBookingNoticeHours,
      status: "AVAILABLE",
      explanation: `Hay ${availableSlots.length} ${
        availableSlots.length === 1
          ? "horario disponible"
          : "horarios disponibles"
      } para una cita de ${resolvedAppointmentMinutes} minutos.`,
      availableSlots,
      suggestion: null,
    });
  }

  if (date === today) {
    const latestEndTime = availabilities.reduce(
      (latestTime, availability) =>
        availability.endTime > latestTime
          ? availability.endTime
          : latestTime,
      availabilities[0].endTime,
    );

    const endOfWorkingDay = fromZonedTime(
      `${date}T${latestEndTime}:00`,
      timezone,
    );

    const minimumAllowedStart = addMinutes(
      now,
      minimumBookingNoticeHours * 60,
    );

    if (
      isAfter(minimumAllowedStart, endOfWorkingDay) ||
      isEqual(minimumAllowedStart, endOfWorkingDay)
    ) {
      const suggestion = searchNextAvailableDate
        ? await findNextAvailableSlot({
            clinicId,
            date,
            appointmentMinutes: resolvedAppointmentMinutes,
            now,
          })
        : null;

      return buildContext({
        date,
        timezone,
        appointmentMinutes: resolvedAppointmentMinutes,
        minimumBookingNoticeHours,
        status: "TODAY_FINISHED",
        explanation:
          "La jornada laboral de hoy ya terminó o ya no permite reservar con la anticipación configurada.",
        availableSlots: [],
        suggestion,
      });
    }
  }

  const shortSlots = await getAvailableSlots({
    clinicId,
    date,
    appointmentMinutes: MINIMUM_DIAGNOSTIC_SLOT_MINUTES,
    now,
  });

  const suggestion = searchNextAvailableDate
    ? await findNextAvailableSlot({
        clinicId,
        date,
        appointmentMinutes: resolvedAppointmentMinutes,
        now,
      })
    : null;

  if (shortSlots.length > 0) {
    return buildContext({
      date,
      timezone,
      appointmentMinutes: resolvedAppointmentMinutes,
      minimumBookingNoticeHours,
      status: "NO_CONTINUOUS_SPACE",
      explanation: `Hay espacios libres ese día, pero ninguno permite una cita continua de ${resolvedAppointmentMinutes} minutos.`,
      availableSlots: [],
      suggestion,
    });
  }

  return buildContext({
    date,
    timezone,
    appointmentMinutes: resolvedAppointmentMinutes,
    minimumBookingNoticeHours,
    status: "DAY_FULL",
    explanation:
      "La agenda está completamente ocupada o bloqueada para esta fecha.",
    availableSlots: [],
    suggestion,
  });
}