import {
  addMinutes,
  areIntervalsOverlapping,
  isBefore,
  isEqual,
} from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db/prisma";

const DEFAULT_TIMEZONE = "America/Mexico_City";
const DEFAULT_APPOINTMENT_MINUTES = 60;
const DEFAULT_MINIMUM_BOOKING_NOTICE_HOURS = 2;

const BLOCKING_APPOINTMENT_STATUSES = ["PENDING", "CONFIRMED"] as const;

type GetAvailableSlotsInput = {
  clinicId: string;
  date: string;
  appointmentMinutes?: number;
  now?: Date;
};

export type AvailableSlot = {
  startAt: Date;
  endAt: Date;
  startAtIso: string;
  endAtIso: string;
  localDate: string;
  localStartTime: string;
  localEndTime: string;
  timezone: string;
};

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTimeString(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getLocalDateTimeUtc(
  date: string,
  time: string,
  timezone: string,
) {
  return fromZonedTime(`${date}T${time}:00`, timezone);
}

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

export async function getAvailableSlots({
  clinicId,
  date,
  appointmentMinutes,
  now = new Date(),
}: GetAvailableSlotsInput): Promise<AvailableSlot[]> {
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
  });

  const timezone = settings?.timezone ?? DEFAULT_TIMEZONE;

  const slotDuration =
    appointmentMinutes ??
    settings?.defaultAppointmentMinutes ??
    DEFAULT_APPOINTMENT_MINUTES;

  const minimumBookingNoticeHours =
    settings?.minimumBookingNoticeHours ??
    DEFAULT_MINIMUM_BOOKING_NOTICE_HOURS;

  if (!Number.isInteger(slotDuration) || slotDuration <= 0) {
    throw new Error("appointmentMinutes must be a positive integer");
  }

  const localMidday = toZonedTime(
    fromZonedTime(`${date}T12:00:00`, timezone),
    timezone,
  );

  const dayOfWeek = localMidday.getDay();

  const availabilities = await prisma.scheduleAvailability.findMany({
    where: {
      clinicId,
      dayOfWeek,
      isActive: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (availabilities.length === 0) {
    return [];
  }

  for (const availability of availabilities) {
    if (
      !isValidTimeString(availability.startTime) ||
      !isValidTimeString(availability.endTime)
    ) {
      throw new Error(
        `Invalid availability time format for availability ${availability.id}`,
      );
    }
  }

  const dayStart = getLocalDateTimeUtc(date, "00:00", timezone);
  const nextDayStart = addMinutes(dayStart, 24 * 60);

  const [appointments, scheduleBlocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        clinicId,
        status: {
          in: [...BLOCKING_APPOINTMENT_STATUSES],
        },
        startAt: {
          lt: nextDayStart,
        },
        endAt: {
          gt: dayStart,
        },
      },
      select: {
        startAt: true,
        endAt: true,
      },
    }),
    prisma.scheduleBlock.findMany({
      where: {
        clinicId,
        startAt: {
          lt: nextDayStart,
        },
        endAt: {
          gt: dayStart,
        },
      },
      select: {
        startAt: true,
        endAt: true,
      },
    }),
  ]);

  const minimumAllowedStart = addMinutes(
    now,
    minimumBookingNoticeHours * 60,
  );

  const slots: AvailableSlot[] = [];

  for (const availability of availabilities) {
    const availabilityStart = getLocalDateTimeUtc(
      date,
      availability.startTime,
      timezone,
    );

    const availabilityEnd = getLocalDateTimeUtc(
      date,
      availability.endTime,
      timezone,
    );

    if (
      isBefore(availabilityEnd, availabilityStart) ||
      isEqual(availabilityEnd, availabilityStart)
    ) {
      continue;
    }

    let candidateStart = availabilityStart;

    while (true) {
      const candidateEnd = addMinutes(candidateStart, slotDuration);

      if (isBefore(availabilityEnd, candidateEnd)) {
        break;
      }

      const isTooSoon = isBefore(candidateStart, minimumAllowedStart);

      const overlapsAppointment = appointments.some((appointment) =>
        intervalsOverlap(
          candidateStart,
          candidateEnd,
          appointment.startAt,
          appointment.endAt,
        ),
      );

      const overlapsBlock = scheduleBlocks.some((block) =>
        intervalsOverlap(
          candidateStart,
          candidateEnd,
          block.startAt,
          block.endAt,
        ),
      );

      if (!isTooSoon && !overlapsAppointment && !overlapsBlock) {
        slots.push({
          startAt: candidateStart,
          endAt: candidateEnd,
          startAtIso: candidateStart.toISOString(),
          endAtIso: candidateEnd.toISOString(),
          localDate: formatInTimeZone(
            candidateStart,
            timezone,
            "yyyy-MM-dd",
          ),
          localStartTime: formatInTimeZone(
            candidateStart,
            timezone,
            "HH:mm",
          ),
          localEndTime: formatInTimeZone(
            candidateEnd,
            timezone,
            "HH:mm",
          ),
          timezone,
        });
      }

      candidateStart = addMinutes(candidateStart, slotDuration);
    }
  }

  return slots.sort(
    (firstSlot, secondSlot) =>
      firstSlot.startAt.getTime() - secondSlot.startAt.getTime(),
  );
}