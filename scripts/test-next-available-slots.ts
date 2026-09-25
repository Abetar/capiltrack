import { prisma } from "../lib/db/prisma";
import { getNextAvailableSlots } from "../lib/appointments/getNextAvailableSlots";

const CLINIC_ID = "cmmp6xnz30000akx1giilkyr5";

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
          timezone: true,
          defaultAppointmentMinutes: true,
          minimumBookingNoticeHours: true,
        },
      },
    },
  });

  if (!clinic) {
    throw new Error(
      "No existe la clínica de prueba.",
    );
  }

  const fromDate = "2026-08-09";

  console.log("\n=== CLINIC ===");
  console.dir(clinic, {
    depth: null,
  });

  console.log("\n=== SEARCH ===");
  console.dir(
    {
      fromDate,
      appointmentMinutes:
        clinic.scheduleSettings?.defaultAppointmentMinutes ??
        60,
      minimumBookingNoticeHours:
        clinic.scheduleSettings?.minimumBookingNoticeHours ??
        2,
    },
    {
      depth: null,
    },
  );

  const result = await getNextAvailableSlots({
    clinicId: clinic.id,
    fromDate,
    appointmentMinutes:
      clinic.scheduleSettings?.defaultAppointmentMinutes ??
      60,
    maxDaysToSearch: 30,
    maxSlots: 5,
  });

  console.log("\n=== NEXT AVAILABLE SLOTS ===");

  if (!result) {
    console.log(
      "No se encontró disponibilidad dentro de los próximos 30 días.",
    );

    return;
  }

  console.dir(
    {
      date: result.date,
      slots: result.slots.map((slot) => ({
        localDate: slot.localDate,
        localStartTime: slot.localStartTime,
        localEndTime: slot.localEndTime,
        timezone: slot.timezone,
      })),
    },
    {
      depth: null,
    },
  );
}

main()
  .catch((error) => {
    console.error("\nTEST_NEXT_AVAILABLE_SLOTS_ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });