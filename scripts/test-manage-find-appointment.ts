import { prisma } from "../lib/db/prisma";
import { getOrCreateConversation } from "../lib/whatsapp/getOrCreateConversation";
import { saveConversationContext } from "../lib/agent/saveConversationContext";
import { processPersistedConversationInput } from "../lib/agent/processPersistedConversationInput";

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
    displayName: "Paciente gestión citas",
  });

  const appointmentIds: string[] = [];

  try {
    const appointment1 = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientName: "Paciente gestión citas",
        patientPhone: phoneNumber,
        startAt: new Date("2026-08-10T15:00:00.000Z"),
        endAt: new Date("2026-08-10T16:00:00.000Z"),
        timezone: "America/Mexico_City",
        status: "PENDING",
        source: "WHATSAPP_AI",
      },
    });

    appointmentIds.push(appointment1.id);

    const appointment2 = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientName: "Paciente gestión citas",
        patientPhone: phoneNumber,
        startAt: new Date("2026-08-12T17:00:00.000Z"),
        endAt: new Date("2026-08-12T18:00:00.000Z"),
        timezone: "America/Mexico_City",
        status: "CONFIRMED",
        source: "WHATSAPP_AI",
      },
    });

    appointmentIds.push(appointment2.id);

    await saveConversationContext({
      clinicId: clinic.id,
      conversationId: conversation.id,
      context: {
        state: "MAIN_MENU",
      },
    });

    console.log("\n=== STEP 1 - MAIN MENU OPTION 2 ===");

    const searchResult =
      await processPersistedConversationInput({
        clinicId: clinic.id,
        conversationId: conversation.id,
        message: "2",
      });

    console.dir(searchResult, {
      depth: null,
    });

    if (
      searchResult.nextContext.state !==
      "MANAGE_FIND_APPOINTMENT"
    ) {
      throw new Error(
        `Estado inesperado después de buscar citas: ${searchResult.nextContext.state}`,
      );
    }

    if (
      searchResult.nextContext.availableAppointments?.length !==
      2
    ) {
      throw new Error(
        "Se esperaban 2 citas disponibles en el contexto.",
      );
    }

    if (searchResult.requiresAiInterpretation) {
      throw new Error(
        "Buscar citas no debería consumir IA.",
      );
    }

    console.log("\n=== STEP 2 - SELECT SECOND APPOINTMENT ===");

    const selectionResult =
      await processPersistedConversationInput({
        clinicId: clinic.id,
        conversationId: conversation.id,
        message: "2",
      });

    console.dir(selectionResult, {
      depth: null,
    });

    if (
      selectionResult.nextContext.state !== "MANAGE_MENU"
    ) {
      throw new Error(
        `Estado inesperado después de seleccionar cita: ${selectionResult.nextContext.state}`,
      );
    }

    if (
      selectionResult.nextContext.appointmentId !==
      appointment2.id
    ) {
      throw new Error(
        "No se seleccionó la segunda cita esperada.",
      );
    }

    if (selectionResult.requiresAiInterpretation) {
      throw new Error(
        "Seleccionar una cita no debería consumir IA.",
      );
    }

    console.log("\n=== TEST PASSED ===");
    console.log(
      "Consulta de múltiples citas y selección funcionan sin IA.",
    );
  } finally {
    if (appointmentIds.length > 0) {
      await prisma.appointment.deleteMany({
        where: {
          id: {
            in: appointmentIds,
          },
        },
      });

      console.log("\n=== TEST APPOINTMENTS DELETED ===");
      console.log(appointmentIds);
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
    console.error("\nTEST_MANAGE_FIND_APPOINTMENT_ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });