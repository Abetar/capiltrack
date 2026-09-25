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
          minimumBookingNoticeHours: true,
        },
      },
    },
  });

  if (!clinic) {
    throw new Error("No existe la clínica de prueba.");
  }

  /*
   * Simulamos:
   *
   * Lunes 10 de agosto de 2026
   * 17:00 hora de Ciudad de México.
   *
   * Además, la clínica tiene 2 horas de anticipación mínima.
   * Por lo tanto, no debería quedar ningún slot válido ese lunes.
   */
  const simulatedNow = fromZonedTime(
    "2026-08-10T17:00:00",
    TIMEZONE,
  );

  const requestedDate = "2026-08-10";
  const requestedStartTime = "16:00";

  console.log("\n=== SCENARIO ===");

  console.dir({
    clinic: clinic.name,
    simulatedLocalNow: "2026-08-10 17:00",
    requestedDate,
    requestedStartTime,
    appointmentMinutes:
      clinic.scheduleSettings?.defaultAppointmentMinutes ?? 60,
    minimumBookingNoticeHours:
      clinic.scheduleSettings?.minimumBookingNoticeHours ?? 2,
  });

  const result = await getSuggestedAvailableSlots({
    clinicId: clinic.id,
    requestedDate,
    requestedStartTime,
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
}

main()
  .catch((error) => {
    console.error("\nTEST_SUGGESTED_AVAILABLE_SLOTS_ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });