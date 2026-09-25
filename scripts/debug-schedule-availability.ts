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
    },
  });

  if (!clinic) {
    throw new Error("No existe la clínica de prueba.");
  }

  const [settings, availabilities, blocks] = await Promise.all([
    prisma.scheduleSettings.findUnique({
      where: {
        clinicId: clinic.id,
      },
    }),

    prisma.scheduleAvailability.findMany({
      where: {
        clinicId: clinic.id,
      },
      orderBy: [
        {
          dayOfWeek: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    }),

    prisma.scheduleBlock.findMany({
      where: {
        clinicId: clinic.id,
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

  console.log("\n=== CLINIC ===");
  console.dir(clinic, {
    depth: null,
  });

  console.log("\n=== SCHEDULE SETTINGS ===");
  console.dir(settings, {
    depth: null,
  });

  console.log("\n=== WEEKLY AVAILABILITY ===");
  console.dir(availabilities, {
    depth: null,
  });

  console.log("\n=== SCHEDULE BLOCKS ===");
  console.dir(blocks, {
    depth: null,
  });
}

main()
  .catch((error) => {
    console.error("\nDEBUG_SCHEDULE_AVAILABILITY_ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });