import { prisma } from "../lib/db/prisma";
import { getOrCreateConversation } from "../lib/whatsapp/getOrCreateConversation";
import { getUpcomingConversationAppointments } from "../lib/agent/getUpcomingConversationAppointments";

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

  const phoneNumber = `+52133${Date.now()
    .toString()
    .slice(-8)}`;

  const conversation = await getOrCreateConversation({
    clinicId: clinic.id,
    phoneNumber,
    displayName: "Paciente prueba próximas citas",
  });

  const createdAppointmentIds: string[] = [];

  /*
   * Controlamos "now" para que el test siempre sea reproducible.
   */
  const simulatedNow = new Date(
    "2026-08-09T20:00:00.000Z",
  );

  try {
    const futureAppointment1 =
      await prisma.appointment.create({
        data: {
          clinicId: clinic.id,

          patientName: "Paciente prueba próximas citas",
          patientPhone: phoneNumber,

          startAt: new Date(
            "2026-08-10T15:00:00.000Z",
          ),
          endAt: new Date(
            "2026-08-10T16:00:00.000Z",
          ),

          timezone: "America/Mexico_City",

          status: "PENDING",
          source: "WHATSAPP_AI",
        },
      });

    createdAppointmentIds.push(futureAppointment1.id);

    const futureAppointment2 =
      await prisma.appointment.create({
        data: {
          clinicId: clinic.id,

          patientName: "Paciente prueba próximas citas",
          patientPhone: phoneNumber,

          startAt: new Date(
            "2026-08-12T17:00:00.000Z",
          ),
          endAt: new Date(
            "2026-08-12T18:00:00.000Z",
          ),

          timezone: "America/Mexico_City",

          status: "CONFIRMED",
          source: "WHATSAPP_AI",
        },
      });

    createdAppointmentIds.push(futureAppointment2.id);

    /*
     * Esta cita está cancelada.
     * NO debe regresar.
     */
    const cancelledAppointment =
      await prisma.appointment.create({
        data: {
          clinicId: clinic.id,

          patientName: "Paciente prueba próximas citas",
          patientPhone: phoneNumber,

          startAt: new Date(
            "2026-08-11T15:00:00.000Z",
          ),
          endAt: new Date(
            "2026-08-11T16:00:00.000Z",
          ),

          timezone: "America/Mexico_City",

          status: "CANCELLED",
          source: "WHATSAPP_AI",
        },
      });

    createdAppointmentIds.push(cancelledAppointment.id);

    /*
     * Esta cita ya pasó.
     * NO debe regresar.
     */
    const pastAppointment =
      await prisma.appointment.create({
        data: {
          clinicId: clinic.id,

          patientName: "Paciente prueba próximas citas",
          patientPhone: phoneNumber,

          startAt: new Date(
            "2026-08-08T15:00:00.000Z",
          ),
          endAt: new Date(
            "2026-08-08T16:00:00.000Z",
          ),

          timezone: "America/Mexico_City",

          status: "PENDING",
          source: "WHATSAPP_AI",
        },
      });

    createdAppointmentIds.push(pastAppointment.id);

    /*
     * Esta cita pertenece a otro teléfono.
     * NO debe regresar.
     */
    const differentPatientAppointment =
      await prisma.appointment.create({
        data: {
          clinicId: clinic.id,

          patientName: "Otro paciente",
          patientPhone: "+5213300000000",

          startAt: new Date(
            "2026-08-10T16:00:00.000Z",
          ),
          endAt: new Date(
            "2026-08-10T17:00:00.000Z",
          ),

          timezone: "America/Mexico_City",

          status: "PENDING",
          source: "MANUAL",
        },
      });

    createdAppointmentIds.push(
      differentPatientAppointment.id,
    );

    console.log("\n=== SEARCHING UPCOMING APPOINTMENTS ===");

    const appointments =
      await getUpcomingConversationAppointments({
        clinicId: clinic.id,
        conversationId: conversation.id,
        now: simulatedNow,
      });

    console.dir(appointments, {
      depth: null,
    });

    if (appointments.length !== 2) {
      throw new Error(
        `Se esperaban 2 citas y regresaron ${appointments.length}.`,
      );
    }

    if (
      appointments[0].id !== futureAppointment1.id ||
      appointments[1].id !== futureAppointment2.id
    ) {
      throw new Error(
        "Las citas no regresaron en el orden esperado.",
      );
    }

    console.log("\n=== TEST PASSED ===");
    console.log(
      "Solo regresaron las próximas citas válidas del paciente.",
    );
  } finally {
    if (createdAppointmentIds.length > 0) {
      await prisma.appointment.deleteMany({
        where: {
          id: {
            in: createdAppointmentIds,
          },
        },
      });

      console.log("\n=== TEST APPOINTMENTS DELETED ===");
      console.log(createdAppointmentIds);
    }

    await prisma.whatsAppConversation.delete({
      where: {
        id: conversation.id,
      },
    });

    console.log("\n=== TEST CONVERSATION DELETED ===");
    console.log(conversation.id);
  }
}

main()
  .catch((error) => {
    console.error(
      "\nTEST_UPCOMING_CONVERSATION_APPOINTMENTS_ERROR",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });