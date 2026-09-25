import { fromZonedTime } from "date-fns-tz";

import { prisma } from "../lib/db/prisma";
import { getSuggestedAvailableSlots } from "../lib/appointments/getSuggestedAvailableSlots";

const CLINIC_ID = "cmmp6xnz30000akx1giilkyr5";
const TIMEZONE = "America/Mexico_City";

async function main() {
  const clinic = await prisma.clinic.findUnique({
    where: {
      id: CLINIC_ID,
    },
    select: {
      id: true,
      name: true,
      scheduleSettings: {
        select: {
          defaultAppointmentMinutes: true,
        },
      },
    },
  });

  if (!clinic) {
    throw new Error("No existe la clínica de prueba.");
  }

  /*
   * Simulamos que estamos:
   * lunes 10 de agosto de 2026 a las 08:00.
   *
   * Y bloqueamos:
   * lunes 10 → jueves 13 completos.
   *
   * La primera disponibilidad debería aparecer
   * el viernes 14.
   */
  const simulatedNow = fromZonedTime(
    "2026-08-10T08:00:00",
    TIMEZONE,
  );

  const blockStart = fromZonedTime(
    "2026-08-10T00:00:00",
    TIMEZONE,
  );

  const blockEnd = fromZonedTime(
    "2026-08-14T00:00:00",
    TIMEZONE,
  );

  let blockId: string | null = null;

  try {
    const block = await prisma.scheduleBlock.create({
      data: {
        clinicId: clinic.id,
        title: "TEST - Vacaciones agente",
        startAt: blockStart,
        endAt: blockEnd,
        notes:
          "Bloqueo temporal creado por test-blocked-next-availability.ts",
      },
    });

    blockId = block.id;

    console.log("\n=== TEMPORARY BLOCK CREATED ===");

    console.dir({
      id: block.id,
      title: block.title,
      startAt: block.startAt,
      endAt: block.endAt,
    });

    const result = await getSuggestedAvailableSlots({
      clinicId: clinic.id,
      requestedDate: "2026-08-10",
      appointmentMinutes:
        clinic.scheduleSettings?.defaultAppointmentMinutes ?? 60,
      maxSlots: 3,
      maxDaysToSearch: 30,
      now: simulatedNow,
    });

    console.log("\n=== SUGGESTION ===");

    if (!result) {
      console.log(
        "No se encontró disponibilidad dentro del periodo de búsqueda.",
      );

      return;
    }

    console.dir(
      {
        requestedDate: result.requestedDate,
        resolvedDate: result.resolvedDate,
        exactMatch: result.exactMatch,
        usedFallbackDate: result.usedFallbackDate,
        slots: result.slots.map((slot) => ({
          localDate: slot.localDate,
          localStartTime: slot.localStartTime,
          localEndTime: slot.localEndTime,
        })),
      },
      {
        depth: null,
      },
    );
  } finally {
    if (blockId) {
      await prisma.scheduleBlock.delete({
        where: {
          id: blockId,
        },
      });

      console.log("\n=== TEMPORARY BLOCK DELETED ===");
      console.log(blockId);
    }
  }
}

main()
  .catch((error) => {
    console.error(
      "\nTEST_BLOCKED_NEXT_AVAILABILITY_ERROR",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });