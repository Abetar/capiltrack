import { NextResponse } from "next/server";
import { addDays, format, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";

const DEFAULT_TIMEZONE = "America/Mexico_City";

type ScheduleBlockType = "HOURS" | "FULL_DAY" | "DATE_RANGE";

type CreateScheduleBlockBody = {
  blockType?: ScheduleBlockType;

  title?: string;
  notes?: string | null;

  // HOURS
  date?: string;
  startTime?: string;
  endTime?: string;

  // FULL_DAY
  fullDayDate?: string;

  // DATE_RANGE
  startDate?: string;
  endDate?: string;
};

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  return !Number.isNaN(parsedDate.getTime());
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getNextDateString(date: string) {
  return format(
    addDays(parseISO(`${date}T12:00:00`), 1),
    "yyyy-MM-dd",
  );
}

function isValidBlockType(
  value: unknown,
): value is ScheduleBlockType {
  return (
    value === "HOURS" ||
    value === "FULL_DAY" ||
    value === "DATE_RANGE"
  );
}

export async function POST(req: Request) {
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

    const body = (await req.json()) as CreateScheduleBlockBody;

    /*
     * Si el formulario anterior todavía no envía blockType,
     * se interpreta como bloqueo por horas.
     */
    const blockType: ScheduleBlockType =
      body.blockType === undefined
        ? "HOURS"
        : isValidBlockType(body.blockType)
          ? body.blockType
          : "HOURS";

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    if (!title) {
      return NextResponse.json(
        {
          error: "El motivo del bloqueo es obligatorio",
          code: "TITLE_REQUIRED",
        },
        { status: 400 },
      );
    }

    const settings =
      await prisma.scheduleSettings.findUnique({
        where: {
          clinicId: user.clinicId,
        },
        select: {
          timezone: true,
        },
      });

    const timezone =
      settings?.timezone ?? DEFAULT_TIMEZONE;

    let startAt: Date;
    let endAt: Date;

    if (blockType === "HOURS") {
      const date =
        typeof body.date === "string"
          ? body.date.trim()
          : "";

      const startTime =
        typeof body.startTime === "string"
          ? body.startTime.trim()
          : "";

      const endTime =
        typeof body.endTime === "string"
          ? body.endTime.trim()
          : "";

      if (!isValidDate(date)) {
        return NextResponse.json(
          {
            error: "La fecha no es válida",
            code: "INVALID_DATE",
          },
          { status: 400 },
        );
      }

      if (
        !isValidTime(startTime) ||
        !isValidTime(endTime)
      ) {
        return NextResponse.json(
          {
            error: "El horario no es válido",
            code: "INVALID_TIME",
          },
          { status: 400 },
        );
      }

      startAt = fromZonedTime(
        `${date}T${startTime}:00`,
        timezone,
      );

      endAt = fromZonedTime(
        `${date}T${endTime}:00`,
        timezone,
      );
    } else if (blockType === "FULL_DAY") {
      const fullDayDate =
        typeof body.fullDayDate === "string"
          ? body.fullDayDate.trim()
          : "";

      if (!isValidDate(fullDayDate)) {
        return NextResponse.json(
          {
            error:
              "La fecha del bloqueo completo no es válida",
            code: "INVALID_DATE",
          },
          { status: 400 },
        );
      }

      const nextDate = getNextDateString(fullDayDate);

      startAt = fromZonedTime(
        `${fullDayDate}T00:00:00`,
        timezone,
      );

      /*
       * El final es exclusivo:
       * desde las 00:00 del día elegido
       * hasta las 00:00 del día siguiente.
       */
      endAt = fromZonedTime(
        `${nextDate}T00:00:00`,
        timezone,
      );
    } else {
      const startDate =
        typeof body.startDate === "string"
          ? body.startDate.trim()
          : "";

      const endDate =
        typeof body.endDate === "string"
          ? body.endDate.trim()
          : "";

      if (
        !isValidDate(startDate) ||
        !isValidDate(endDate)
      ) {
        return NextResponse.json(
          {
            error:
              "Las fechas del periodo no son válidas",
            code: "INVALID_DATE_RANGE",
          },
          { status: 400 },
        );
      }

      if (endDate < startDate) {
        return NextResponse.json(
          {
            error:
              "La fecha final debe ser igual o posterior a la fecha inicial",
            code: "INVALID_DATE_RANGE",
          },
          { status: 400 },
        );
      }

      const dayAfterEndDate =
        getNextDateString(endDate);

      startAt = fromZonedTime(
        `${startDate}T00:00:00`,
        timezone,
      );

      /*
       * Si selecciona del 20 al 27 de julio,
       * se bloquea hasta las 00:00 del 28.
       */
      endAt = fromZonedTime(
        `${dayAfterEndDate}T00:00:00`,
        timezone,
      );
    }

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime()) ||
      endAt.getTime() <= startAt.getTime()
    ) {
      return NextResponse.json(
        {
          error:
            "El periodo de finalización debe ser posterior al inicio",
          code: "INVALID_INTERVAL",
        },
        { status: 400 },
      );
    }

    const [
      overlappingAppointmentsCount,
      firstOverlappingAppointment,
      overlappingBlocksCount,
      firstOverlappingBlock,
    ] = await Promise.all([
      prisma.appointment.count({
        where: {
          clinicId: user.clinicId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          startAt: {
            lt: endAt,
          },
          endAt: {
            gt: startAt,
          },
        },
      }),

      prisma.appointment.findFirst({
        where: {
          clinicId: user.clinicId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          startAt: {
            lt: endAt,
          },
          endAt: {
            gt: startAt,
          },
        },
        orderBy: {
          startAt: "asc",
        },
        select: {
          id: true,
          patientName: true,
          startAt: true,
          endAt: true,
        },
      }),

      prisma.scheduleBlock.count({
        where: {
          clinicId: user.clinicId,
          startAt: {
            lt: endAt,
          },
          endAt: {
            gt: startAt,
          },
        },
      }),

      prisma.scheduleBlock.findFirst({
        where: {
          clinicId: user.clinicId,
          startAt: {
            lt: endAt,
          },
          endAt: {
            gt: startAt,
          },
        },
        orderBy: {
          startAt: "asc",
        },
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
        },
      }),
    ]);

    if (
      overlappingAppointmentsCount > 0 &&
      firstOverlappingAppointment
    ) {
      const appointmentLabel =
        overlappingAppointmentsCount === 1
          ? `existe una cita con ${firstOverlappingAppointment.patientName}`
          : `existen ${overlappingAppointmentsCount} citas dentro de este periodo`;

      return NextResponse.json(
        {
          error:
            `No se puede crear el bloqueo porque ${appointmentLabel}. ` +
            "Reagenda o cancela esas citas antes de bloquear el periodo.",
          code: "OVERLAPS_APPOINTMENT",
          overlappingAppointmentsCount,
        },
        { status: 409 },
      );
    }

    if (
      overlappingBlocksCount > 0 &&
      firstOverlappingBlock
    ) {
      const blockLabel =
        overlappingBlocksCount === 1
          ? `"${firstOverlappingBlock.title || "Horario bloqueado"}"`
          : `${overlappingBlocksCount} bloqueos existentes`;

      return NextResponse.json(
        {
          error:
            `Este periodo coincide con ${blockLabel}. ` +
            "Ajusta las fechas o elimina primero el bloqueo existente.",
          code: "OVERLAPS_SCHEDULE_BLOCK",
          overlappingBlocksCount,
        },
        { status: 409 },
      );
    }

    const scheduleBlock =
      await prisma.scheduleBlock.create({
        data: {
          clinicId: user.clinicId,
          title,
          startAt,
          endAt,
          notes,
        },
      });

    return NextResponse.json(
      {
        ok: true,
        blockType,
        scheduleBlock,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "CREATE_SCHEDULE_BLOCK_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error: "Error interno al crear el bloqueo",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}