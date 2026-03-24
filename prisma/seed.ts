import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  }),
});

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createMetrics(clinicId: string, patientId: string, consultationId: string, baseDensity: number) {
  const zones = ["frontal", "midscalp", "crown"];

  return prisma.hairMetric.createMany({
    data: zones.map((zone, i) => ({
      clinicId,
      patientId,
      consultationId,
      zone,
      density: baseDensity + i * rand(2, 6),
      thickness: 0.05 + Math.random() * 0.02,
    })),
  });
}

async function main() {
  console.log("🌱 Seed clínico REAL");

  const user = await prisma.user.findUnique({
    where: { email: "abrahamgm85@gmail.com" },
  });

  if (!user) throw new Error("Usuario no encontrado");

  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
  });

  if (!clinic) throw new Error("Clínica no encontrada");

  // LIMPIEZA
  await prisma.procedureBlock.deleteMany();
  await prisma.transplantProcedure.deleteMany();
  await prisma.hairMetric.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.patient.deleteMany({
    where: { clinicId: clinic.id },
  });

  console.log("🧹 Base limpia");

  const patients = [
    { name: "Carlos Méndez", trend: "improve" },
    { name: "Luis Ramírez", trend: "worse" },
    { name: "Miguel Torres", trend: "transplant" },
    { name: "Jorge Hernández", trend: "new" },
    { name: "Fernando Lozano", trend: "stable" },
    { name: "Andrés García", trend: "irregular" },
  ];

  for (const p of patients) {
    const [firstName, lastName] = p.name.split(" ");

    const patient = await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        firstName,
        lastName,
        phone: "33" + rand(10000000, 99999999),
        email: `${firstName.toLowerCase()}@gmail.com`,
        gender: "Masculino",
        birthDate: new Date(1985 + rand(0, 15), rand(0, 11), rand(1, 28)),
        notes: "Paciente en seguimiento",
      },
    });

    const dates = [
      new Date("2025-11-10"),
      new Date("2025-12-10"),
      new Date("2026-01-15"),
      new Date("2026-03-05"),
    ];

    let baseDensity = rand(20, 35);

    for (let i = 0; i < dates.length; i++) {
      if (p.trend === "new" && i > 0) break;

      if (p.trend === "improve") baseDensity += 5;
      if (p.trend === "worse") baseDensity -= 3;

      const consultation = await prisma.consultation.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          date: dates[i],
          norwoodLevel: rand(2, 5),
          notes: "Seguimiento clínico",
        },
      });

      await createMetrics(
        clinic.id,
        patient.id,
        consultation.id,
        baseDensity
      );
    }

    // TRATAMIENTOS
    if (p.trend !== "new") {
      await prisma.treatment.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          medication: "Finasteride + Minoxidil",
          frequency: p.trend === "irregular" ? "Irregular" : "Diario",
          startDate: new Date("2025-11-10"),
          endDate:
            p.trend === "worse"
              ? new Date("2025-12-15")
              : undefined,
          notes:
            p.trend === "worse"
              ? "Abandonó tratamiento"
              : "En tratamiento",
        },
      });
    }

    // PROCEDIMIENTOS
    if (p.trend === "transplant" || Math.random() > 0.6) {
      const proc = await prisma.transplantProcedure.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          date: new Date("2026-02-10"),
          technique: "FUE",
          method: "Sapphire",
          grafts: rand(2800, 4200),
          donorArea: "occipital",
          recipientArea: "frontal",
          anesthesiaType: "Local",
          anesthesiaMl: rand(8, 15),
        },
      });

      for (let i = 1; i <= rand(4, 8); i++) {
        await prisma.procedureBlock.create({
          data: {
            procedureId: proc.id,
            blockNumber: i,
            rowIndex: 1,
            uf: rand(240, 320),
            follicles: rand(450, 650),
          },
        });
      }
    }
  }

  console.log("🔥 Seed REAL completado");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());