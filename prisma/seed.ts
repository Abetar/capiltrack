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

function randomThickness(base = 0.05) {
  return Number((base + Math.random() * 0.02).toFixed(3));
}

async function createMetrics(
  clinicId: string,
  patientId: string,
  consultationId: string,
  baseDensity: number
) {
  const zones = ["frontal", "midscalp", "crown"];

  return prisma.hairMetric.createMany({
    data: zones.map((zone, i) => ({
      clinicId,
      patientId,
      consultationId,
      zone,
      density: baseDensity + i * rand(2, 6),
      thickness: randomThickness(),
      notes: "Medición simulada para seguimiento clínico.",
    })),
  });
}

async function main() {
  console.log("🌱 Seed clínico REAL con expediente");

  const user = await prisma.user.findUnique({
    where: { email: "abrahamgm85@gmail.com" },
  });

  if (!user) throw new Error("Usuario no encontrado");

  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
  });

  if (!clinic) throw new Error("Clínica no encontrada");

  await prisma.patientClinicalAnswer.deleteMany({
    where: { clinicId: clinic.id },
  });

  await prisma.clinicalQuestion.deleteMany({
    where: {
      questionnaire: {
        clinicId: clinic.id,
      },
    },
  });

  await prisma.clinicalQuestionnaire.deleteMany({
    where: { clinicId: clinic.id },
  });

  await prisma.procedureBlock.deleteMany();

  await prisma.transplantProcedure.deleteMany({
    where: { clinicId: clinic.id },
  });

  await prisma.hairMetric.deleteMany({
    where: { clinicId: clinic.id },
  });

  await prisma.consultation.deleteMany({
    where: { clinicId: clinic.id },
  });

  await prisma.treatment.deleteMany({
    where: { clinicId: clinic.id },
  });

  await prisma.patient.deleteMany({
    where: { clinicId: clinic.id },
  });

  console.log("🧹 Base limpia");

  const questionnaire = await prisma.clinicalQuestionnaire.create({
    data: {
      clinicId: clinic.id,
      title: "Expediente clínico inicial",
      isActive: true,
    },
  });

  const questionTexts = [
    "¿Es alérgico a algún medicamento, anestesia, alimento o sustancia?",
    "¿Actualmente toma algún medicamento de forma regular?",
    "¿Tiene antecedentes de enfermedades crónicas como hipertensión, diabetes, problemas cardíacos o tiroideos?",
    "¿Ha tenido cirugías previas o procedimientos estéticos relacionados con cuero cabelludo o cabello?",
    "¿Tiene antecedentes familiares de alopecia o pérdida capilar?",
    "¿Desde cuándo notó la pérdida de cabello?",
    "¿Ha usado tratamientos capilares previamente? Indique cuáles y durante cuánto tiempo.",
    "¿Presenta comezón, ardor, descamación, dolor o sensibilidad en el cuero cabelludo?",
    "¿Fuma o consume alcohol con frecuencia?",
    "¿Cuál es su principal expectativa del tratamiento o procedimiento capilar?",
  ];

  const questions = [];

  for (let i = 0; i < questionTexts.length; i++) {
    const question = await prisma.clinicalQuestion.create({
      data: {
        questionnaireId: questionnaire.id,
        questionText: questionTexts[i],
        order: i + 1,
        isRequired: false,
        isActive: true,
      },
    });

    questions.push(question);
  }

  console.log("📋 Cuestionario creado");

  const patients = [
    {
      name: "Carlos Méndez",
      trend: "improve",
      phone: "3312456789",
      email: "carlos.mendez@gmail.com",
      birthDate: new Date("1991-05-14"),
      gender: "Masculino",
      notes: "Paciente disciplinado, busca mejorar densidad frontal.",
      answers: [
        "Niega alergias conocidas.",
        "Finasteride 1 mg diario desde noviembre 2025.",
        "Niega enfermedades crónicas.",
        "Niega cirugías previas.",
        "Padre con alopecia androgenética.",
        "Hace aproximadamente 4 años.",
        "Usó minoxidil tópico de forma intermitente.",
        "Niega molestias actuales.",
        "No fuma, alcohol ocasional.",
        "Mejorar línea frontal y mantener resultado a largo plazo.",
      ],
    },
    {
      name: "Luis Ramírez",
      trend: "worse",
      phone: "3329876541",
      email: "luis.ramirez@gmail.com",
      birthDate: new Date("1987-02-21"),
      gender: "Masculino",
      notes: "Paciente con baja adherencia al tratamiento.",
      answers: [
        "Alergia referida a penicilina.",
        "No toma medicamento actualmente.",
        "Hipertensión controlada.",
        "Niega cirugías capilares previas.",
        "Abuelo materno con alopecia avanzada.",
        "Hace 6 años.",
        "Minoxidil 5%, suspendido por irritación.",
        "Refiere descamación ocasional.",
        "Fuma socialmente, alcohol fines de semana.",
        "Reducir caída y evaluar injerto en zona frontal.",
      ],
    },
    {
      name: "Miguel Torres",
      trend: "transplant",
      phone: "3334567890",
      email: "miguel.torres@gmail.com",
      birthDate: new Date("1983-09-08"),
      gender: "Masculino",
      notes: "Candidato a injerto capilar, alopecia avanzada frontal.",
      answers: [
        "Sin alergias conocidas.",
        "Multivitamínico diario.",
        "Niega enfermedades crónicas.",
        "Cirugía de apéndice en 2010 sin complicaciones.",
        "Padre y hermano con alopecia.",
        "Hace 8 años.",
        "Finasteride por 6 meses, buena tolerancia.",
        "Niega síntomas en cuero cabelludo.",
        "No fuma, alcohol ocasional.",
        "Recuperar densidad frontal con resultado natural.",
      ],
    },
    {
      name: "Jorge Hernández",
      trend: "new",
      phone: "3345678912",
      email: "jorge.hernandez@gmail.com",
      birthDate: new Date("1996-12-03"),
      gender: "Masculino",
      notes: "Paciente nuevo en valoración inicial.",
      answers: [
        "No refiere alergias.",
        "No toma medicamentos.",
        "Niega antecedentes relevantes.",
        "Sin cirugías previas.",
        "Tío materno con pérdida capilar.",
        "Hace 1 año.",
        "No ha usado tratamientos previos.",
        "Refiere comezón leve ocasional.",
        "No fuma, alcohol ocasional.",
        "Conocer diagnóstico y opciones de prevención.",
      ],
    },
    {
      name: "Fernando Lozano",
      trend: "stable",
      phone: "3356789123",
      email: "fernando.lozano@gmail.com",
      birthDate: new Date("1990-07-19"),
      gender: "Masculino",
      notes: "Paciente estable con seguimiento preventivo.",
      answers: [
        "Alergia a ibuprofeno.",
        "Finasteride 1 mg tres veces por semana.",
        "Niega enfermedades crónicas.",
        "Sin procedimientos previos.",
        "Padre con alopecia moderada.",
        "Hace 3 años.",
        "Minoxidil oral a baja dosis bajo supervisión.",
        "Sin síntomas en cuero cabelludo.",
        "No fuma.",
        "Mantener densidad actual y prevenir avance.",
      ],
    },
    {
      name: "Andrés García",
      trend: "irregular",
      phone: "3367891234",
      email: "andres.garcia@gmail.com",
      birthDate: new Date("1989-11-27"),
      gender: "Masculino",
      notes: "Paciente irregular, requiere reforzar adherencia.",
      answers: [
        "Niega alergias.",
        "Toma suplementos ocasionalmente.",
        "Gastritis controlada.",
        "Niega cirugías previas.",
        "Madre refiere familiares con alopecia.",
        "Hace 5 años.",
        "Ha suspendido minoxidil varias veces.",
        "Refiere grasa y descamación ocasional.",
        "Fuma ocasionalmente.",
        "Disminuir caída y mejorar constancia del tratamiento.",
      ],
    },
  ];

  for (const p of patients) {
    const [firstName, lastName] = p.name.split(" ");

    const patient = await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        firstName,
        lastName,
        phone: p.phone,
        email: p.email,
        gender: p.gender,
        birthDate: p.birthDate,
        notes: p.notes,
      },
    });

    for (let i = 0; i < questions.length; i++) {
      await prisma.patientClinicalAnswer.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          questionId: questions[i].id,
          questionTextSnapshot: questions[i].questionText,
          answerText: p.answers[i] || null,
        },
      });
    }

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
      if (p.trend === "stable") baseDensity += rand(-1, 2);
      if (p.trend === "irregular") baseDensity += rand(-3, 3);

      const consultation = await prisma.consultation.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          date: dates[i],
          norwoodLevel:
            p.trend === "transplant"
              ? 4
              : p.trend === "new"
                ? 2
                : rand(2, 5),
          notes:
            p.trend === "worse"
              ? "Se observa progresión por baja adherencia."
              : p.trend === "improve"
                ? "Seguimiento con mejora clínica progresiva."
                : p.trend === "irregular"
                  ? "Evolución variable por uso irregular del tratamiento."
                  : "Seguimiento clínico de rutina.",
        },
      });

      await createMetrics(clinic.id, patient.id, consultation.id, baseDensity);
    }

    if (p.trend !== "new") {
      await prisma.treatment.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          medication:
            p.trend === "worse"
              ? "Minoxidil tópico 5%"
              : "Finasteride + Minoxidil",
          dosage:
            p.trend === "worse"
              ? "Aplicación tópica"
              : "Finasteride 1 mg + Minoxidil 5%",
          frequency:
            p.trend === "irregular"
              ? "Irregular"
              : p.trend === "stable"
                ? "Diario / mantenimiento"
                : "Diario",
          startDate: new Date("2025-11-10"),
          endDate: p.trend === "worse" ? new Date("2025-12-15") : null,
          notes:
            p.trend === "worse"
              ? "Paciente suspendió tratamiento por irritación."
              : p.trend === "irregular"
                ? "Se reforzó importancia de adherencia."
                : "Tratamiento activo con seguimiento.",
        },
      });
    }

    if (
      p.trend === "transplant" ||
      p.trend === "improve" ||
      p.trend === "stable"
    ) {
      const grafts =
        p.trend === "transplant" ? rand(3600, 4400) : rand(2400, 3300);

      const extractedFollicularUnits = grafts + rand(40, 140);
      const implantedFollicularUnits = grafts - rand(0, 60);

      const extractedFollicles = extractedFollicularUnits * rand(2, 3);
      const implantedFollicles =
        implantedFollicularUnits * rand(2, 3) - rand(0, 80);

      const procedureDate =
        p.trend === "transplant"
          ? new Date("2026-02-10")
          : p.trend === "improve"
            ? new Date("2026-01-28")
            : new Date("2026-03-12");

      const proc = await prisma.transplantProcedure.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          date: procedureDate,
          technique: "FUE",
          method: "Sapphire",
          grafts,

          extractedFollicularUnits,
          implantedFollicularUnits,
          extractedFollicles,
          implantedFollicles,

          donorArea: "occipital",
          recipientArea:
            p.trend === "stable" ? "entradas y frontal" : "frontal",
          anesthesiaType: "Local",
          anesthesiaMl: rand(8, 15),
          extractionStart: new Date("2026-02-10T08:30:00"),
          extractionEnd: new Date("2026-02-10T11:30:00"),
          implantationStart: new Date("2026-02-10T12:15:00"),
          implantationEnd: new Date("2026-02-10T16:10:00"),
          medicalTeam: "Dr. Sánchez + equipo quirúrgico",
          nurses: "Ana Martínez / Laura Rivas",
          notes: "Procedimiento sin complicaciones.",
          observations:
            "Buena calidad de zona donante y adecuada distribución de unidades foliculares.",
        },
      });

      const blocks = rand(5, 8);

      for (let i = 1; i <= blocks; i++) {
        await prisma.procedureBlock.create({
          data: {
            procedureId: proc.id,
            blockNumber: i,
            rowIndex: 1,
            enf1: i % 2 === 0 ? "Ana" : "Laura",
            enf2: i % 2 === 0 ? "Laura" : "Ana",
            uf: rand(240, 320),
            follicles: rand(450, 680),
          },
        });
      }
    }
  }

  console.log("🔥 Seed REAL con expediente y procedimientos completado");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());