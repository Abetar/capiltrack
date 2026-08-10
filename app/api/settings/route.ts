import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextResponse } from "next/server";

const ALLOWED_TIMEZONES = new Set([
  "America/Mexico_City",
  "America/Monterrey",
  "America/Tijuana",
  "America/Cancun",
  "America/Hermosillo",
]);

type ScheduleAvailabilityInput = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
};

function parseInteger(value: FormDataEntryValue | null, fallback: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isInteger(parsedValue) ? parsedValue : fallback;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function parseScheduleAvailabilities(
  value: FormDataEntryValue | null,
): ScheduleAvailabilityInput[] {
  if (typeof value !== "string") {
    throw new Error("Horario semanal inválido");
  }

  const parsedValue: unknown = JSON.parse(value);

  if (!Array.isArray(parsedValue)) {
    throw new Error("Horario semanal inválido");
  }

  return parsedValue.map((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("dayOfWeek" in item) ||
      !("isActive" in item) ||
      !("startTime" in item) ||
      !("endTime" in item)
    ) {
      throw new Error("Horario semanal inválido");
    }

    const dayOfWeek = Number(item.dayOfWeek);
    const isActive = Boolean(item.isActive);
    const startTime = String(item.startTime);
    const endTime = String(item.endTime);

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new Error("Día de la semana inválido");
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      throw new Error("Formato de horario inválido");
    }

    if (isActive && startTime >= endTime) {
      throw new Error(
        "La hora de inicio debe ser anterior a la hora de cierre",
      );
    }

    return {
      dayOfWeek,
      isActive,
      startTime,
      endTime,
    };
  });
}

export async function POST(req: Request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();

    const name = formData.get("name");
    const doctorName = formData.get("doctorName");
    const doctorLicense = formData.get("doctorLicense");
    const doctorPhone = formData.get("doctorPhone");
    const doctorSpecialty = formData.get("doctorSpecialty");
    const doctorBranch = formData.get("doctorBranch");
    const doctorUniversity = formData.get("doctorUniversity");

    const requestedTimezone = formData.get("timezone");

    const timezone =
      typeof requestedTimezone === "string" &&
      ALLOWED_TIMEZONES.has(requestedTimezone)
        ? requestedTimezone
        : "America/Mexico_City";

    const defaultAppointmentMinutes = parseInteger(
      formData.get("defaultAppointmentMinutes"),
      60,
    );

    const minimumBookingNoticeHours = parseInteger(
      formData.get("minimumBookingNoticeHours"),
      2,
    );

    const reminderHoursBefore = parseInteger(
      formData.get("reminderHoursBefore"),
      24,
    );

    if (defaultAppointmentMinutes < 5 || defaultAppointmentMinutes > 480) {
      return NextResponse.json(
        { error: "La duración de cita no es válida" },
        { status: 400 },
      );
    }

    if (minimumBookingNoticeHours < 0 || minimumBookingNoticeHours > 720) {
      return NextResponse.json(
        { error: "La anticipación mínima no es válida" },
        { status: 400 },
      );
    }

    if (reminderHoursBefore < 1 || reminderHoursBefore > 720) {
      return NextResponse.json(
        { error: "El tiempo del recordatorio no es válido" },
        { status: 400 },
      );
    }

    let scheduleAvailabilities: ScheduleAvailabilityInput[];

    try {
      scheduleAvailabilities = parseScheduleAvailabilities(
        formData.get("scheduleAvailabilities"),
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Horario semanal inválido",
        },
        { status: 400 },
      );
    }

    const file = formData.get("logo") as File | null;

    const clinic = await prisma.clinic.findUnique({
      where: {
        id: user.clinicId,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clínica no encontrada" },
        { status: 404 },
      );
    }

    let logoUrl = clinic.logoUrl;

    if (file && file.size > 0) {
      const cloudinaryForm = new FormData();

      cloudinaryForm.append("file", file);
      cloudinaryForm.append("upload_preset", "nomadisch_unsigned");

      const cloudinaryResponse = await fetch(
        "https://api.cloudinary.com/v1_1/dslzzoqjy/image/upload",
        {
          method: "POST",
          body: cloudinaryForm,
        },
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (!cloudinaryResponse.ok || !cloudinaryData.secure_url) {
        return NextResponse.json(
          {
            error: "Error al subir imagen a Cloudinary",
            details: cloudinaryData,
          },
          { status: 400 },
        );
      }

      logoUrl = cloudinaryData.secure_url;
    }

    console.log("SETTINGS_DEBUG", {
      clinicId: clinic.id,
      timezone,
      defaultAppointmentMinutes,
      minimumBookingNoticeHours,
      reminderHoursBefore,
      scheduleAvailabilities,
    });

    const activeAvailabilities = scheduleAvailabilities.filter(
      (availability) => availability.isActive,
    );

    await prisma.$transaction(async (tx) => {
      await tx.clinic.update({
        where: {
          id: clinic.id,
        },
        data: {
          name:
            typeof name === "string" && name.trim() ? name.trim() : clinic.name,
          logoUrl,
          doctorName:
            typeof doctorName === "string" && doctorName.trim()
              ? doctorName.trim()
              : null,
          doctorLicense:
            typeof doctorLicense === "string" && doctorLicense.trim()
              ? doctorLicense.trim()
              : null,
          doctorPhone:
            typeof doctorPhone === "string" && doctorPhone.trim()
              ? doctorPhone.trim()
              : null,
          doctorSpecialty:
            typeof doctorSpecialty === "string" && doctorSpecialty.trim()
              ? doctorSpecialty.trim()
              : null,
          doctorBranch:
            typeof doctorBranch === "string" && doctorBranch.trim()
              ? doctorBranch.trim()
              : null,
          doctorUniversity:
            typeof doctorUniversity === "string" && doctorUniversity.trim()
              ? doctorUniversity.trim()
              : null,
        },
      });

      await tx.scheduleSettings.upsert({
        where: {
          clinicId: clinic.id,
        },
        update: {
          timezone,
          defaultAppointmentMinutes,
          minimumBookingNoticeHours,
          reminderHoursBefore,
        },
        create: {
          clinicId: clinic.id,
          timezone,
          defaultAppointmentMinutes,
          minimumBookingNoticeHours,
          reminderHoursBefore,
        },
      });

      await tx.scheduleAvailability.deleteMany({
        where: {
          clinicId: clinic.id,
        },
      });

      if (activeAvailabilities.length > 0) {
        await tx.scheduleAvailability.createMany({
          data: activeAvailabilities.map((availability) => ({
            clinicId: clinic.id,
            dayOfWeek: availability.dayOfWeek,
            startTime: availability.startTime,
            endTime: availability.endTime,
            isActive: true,
          })),
        });
      }
    });

    console.log("SETTINGS_DEBUG_SAVED", {
      clinicId: clinic.id,
    });

    return NextResponse.json({
      ok: true,
      logoUrl,
    });
  } catch (error) {
    console.error("SETTINGS_ERROR", error);

    return NextResponse.json(
      {
        error: "Error interno al guardar configuración",
      },
      { status: 500 },
    );
  }
}
