import { areIntervalsOverlapping, isBefore, isEqual } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db/prisma";

const DEFAULT_TIMEZONE = "America/Mexico_City";

const BLOCKING_APPOINTMENT_STATUSES = ["PENDING", "CONFIRMED"] as const;

type ValidateAppointmentSlotInput = {
  clinicId: string;
  startAt: Date;
  endAt: Date;
  excludeAppointmentId?: string;
};

export type AppointmentSlotValidationResult =
  | {
      isAvailable: true;
      reason: null;
    }
  | {
      isAvailable: false;
      reason:
        | "INVALID_INTERVAL"
        | "OUTSIDE_WORKING_HOURS"
        | "OVERLAPS_APPOINTMENT"
        | "OVERLAPS_SCHEDULE_BLOCK";
    };

function intervalsOverlap(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
) {
  return areIntervalsOverlapping(
    {
      start: firstStart,
      end: firstEnd,
    },
    {
      start: secondStart,
      end: secondEnd,
    },
    {
      inclusive: false,
    },
  );
}

export async function validateAppointmentSlot({
  clinicId,
  startAt,
  endAt,
  excludeAppointmentId,
}: ValidateAppointmentSlotInput): Promise<AppointmentSlotValidationResult> {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime()) ||
    isBefore(endAt, startAt) ||
    isEqual(endAt, startAt)
  ) {
    return {
      isAvailable: false,
      reason: "INVALID_INTERVAL",
    };
  }

  const settings = await prisma.scheduleSettings.findUnique({
    where: {
      clinicId,
    },
    select: {
      timezone: true,
    },
  });

  const timezone = settings?.timezone ?? DEFAULT_TIMEZONE;

  const localStartDate = formatInTimeZone(startAt, timezone, "yyyy-MM-dd");
  const localEndDate = formatInTimeZone(endAt, timezone, "yyyy-MM-dd");

  if (localStartDate !== localEndDate) {
    return {
      isAvailable: false,
      reason: "OUTSIDE_WORKING_HOURS",
    };
  }

  const dayOfWeek = Number(formatInTimeZone(startAt, timezone, "i")) % 7;

  const localStartTime = formatInTimeZone(startAt, timezone, "HH:mm");
  const localEndTime = formatInTimeZone(endAt, timezone, "HH:mm");

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
  });

  const isInsideWorkingHours = availabilities.some(
    (availability) =>
      localStartTime >= availability.startTime &&
      localEndTime <= availability.endTime,
  );

  if (!isInsideWorkingHours) {
    return {
      isAvailable: false,
      reason: "OUTSIDE_WORKING_HOURS",
    };
  }

  const overlappingAppointment = await prisma.appointment.findFirst({
    where: {
      clinicId,
      id: excludeAppointmentId
        ? {
            not: excludeAppointmentId,
          }
        : undefined,
      status: {
        in: [...BLOCKING_APPOINTMENT_STATUSES],
      },
      startAt: {
        lt: endAt,
      },
      endAt: {
        gt: startAt,
      },
    },
    select: {
      id: true,
    },
  });

  if (overlappingAppointment) {
    return {
      isAvailable: false,
      reason: "OVERLAPS_APPOINTMENT",
    };
  }

  const scheduleBlocks = await prisma.scheduleBlock.findMany({
    where: {
      clinicId,
      startAt: {
        lt: endAt,
      },
      endAt: {
        gt: startAt,
      },
    },
    select: {
      startAt: true,
      endAt: true,
    },
  });

  const overlapsScheduleBlock = scheduleBlocks.some((block) =>
    intervalsOverlap(startAt, endAt, block.startAt, block.endAt),
  );

  if (overlapsScheduleBlock) {
    return {
      isAvailable: false,
      reason: "OVERLAPS_SCHEDULE_BLOCK",
    };
  }

  return {
    isAvailable: true,
    reason: null,
  };
}