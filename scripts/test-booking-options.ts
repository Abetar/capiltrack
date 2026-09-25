import { interpretPatientInput } from "../lib/agent/ai/interpretPatientInput";
import { buildBookingOptions } from "../lib/agent/buildBookingOptions";
import { prisma } from "../lib/db/prisma";

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
        },
      },
    },
  });

  if (!clinic) {
    throw new Error("No existe la clínica de prueba.");
  }

  const timezone =
    clinic.scheduleSettings?.timezone ??
    "America/Mexico_City";

  /*
   * Fecha controlada para que la prueba sea reproducible.
   *
   * Domingo 9 de agosto de 2026.
   * El paciente pide "mañana por la tarde".
   *
   * Esperamos:
   * → 2026-08-10
   * → slots reales de la tarde
   */
  const currentDate = "2026-08-09";
  const currentTime = "15:30";

  const message =
    "Quiero una cita mañana por la tarde";

  console.log("\n=== INPUT ===");

  console.dir({
    clinic: clinic.name,
    currentDate,
    currentTime,
    timezone,
    message,
  });

  const interpretation = await interpretPatientInput({
    message,
    currentDate,
    currentTime,
    timezone,
    context: {
      state: "BOOK_SELECT_DATE",
    },
  });

  console.log("\n=== AI INTERPRETATION ===");

  console.dir(interpretation, {
    depth: null,
  });

  const result = await buildBookingOptions({
    clinicId: clinic.id,
    interpretation,
    context: {
      state: "BOOK_SELECT_DATE",
    },
  });

  console.log("\n=== BOOKING OPTIONS ===");

  console.dir(result, {
    depth: null,
  });
}

main()
  .catch((error) => {
    console.error("\nTEST_BOOKING_OPTIONS_ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });