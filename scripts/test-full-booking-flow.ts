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
    displayName: "Paciente flujo completo",
  });

  let appointmentId: string | null = null;

  try {
    /*
     * Entramos directamente en BOOK_SELECT_DATE.
     *
     * Así probamos específicamente:
     *
     * IA
     * → Agenda
     * → selección determinista
     * → confirmación determinista
     * → Appointment real
     */
    await saveConversationContext({
      clinicId: clinic.id,
      conversationId: conversation.id,
      context: {
        state: "BOOK_SELECT_DATE",
      },
    });

    console.log("\n=== STEP 1 - NATURAL LANGUAGE ===");

    const dateResult =
      await processPersistedConversationInput({
        clinicId: clinic.id,
        conversationId: conversation.id,
        message: "Quiero una cita mañana por la tarde",
      });

    console.dir(dateResult, {
      depth: null,
    });

    if (
      dateResult.nextContext.state !== "BOOK_SELECT_TIME"
    ) {
      throw new Error(
        `Estado inesperado después de interpretar fecha: ${dateResult.nextContext.state}`,
      );
    }

    const offeredSlots =
      dateResult.nextContext.availableSlots ?? [];

    if (offeredSlots.length === 0) {
      throw new Error(
        "El agente no ofreció horarios disponibles.",
      );
    }

    console.log("\n=== STEP 2 - SELECT OPTION 1 ===");

    const selectionResult =
      await processPersistedConversationInput({
        clinicId: clinic.id,
        conversationId: conversation.id,
        message: "1",
      });

    console.dir(selectionResult, {
      depth: null,
    });

    if (
      selectionResult.nextContext.state !== "BOOK_CONFIRM"
    ) {
      throw new Error(
        `Estado inesperado después de seleccionar horario: ${selectionResult.nextContext.state}`,
      );
    }

    if (selectionResult.requiresAiInterpretation) {
      throw new Error(
        "La selección del horario no debería consumir IA.",
      );
    }

    console.log("\n=== STEP 3 - CONFIRM ===");

    const confirmationResult =
      await processPersistedConversationInput({
        clinicId: clinic.id,
        conversationId: conversation.id,
        message: "1",
      });

    console.dir(confirmationResult, {
      depth: null,
    });

    if (confirmationResult.requiresAiInterpretation) {
      throw new Error(
        "La confirmación no debería consumir IA.",
      );
    }

    const updatedConversation =
      await prisma.whatsAppConversation.findUnique({
        where: {
          id: conversation.id,
        },
        select: {
          id: true,
          appointmentId: true,
          currentIntent: true,
          context: true,
        },
      });

    console.log("\n=== CONVERSATION AFTER ===");

    console.dir(updatedConversation, {
      depth: null,
    });

    appointmentId =
      updatedConversation?.appointmentId ?? null;

    if (!appointmentId) {
      throw new Error(
        "La conversación no quedó vinculada a una cita.",
      );
    }

    const appointment =
      await prisma.appointment.findUnique({
        where: {
          id: appointmentId,
        },
        select: {
          id: true,
          patientName: true,
          patientPhone: true,
          startAt: true,
          endAt: true,
          timezone: true,
          status: true,
          source: true,
        },
      });

    console.log("\n=== CREATED APPOINTMENT ===");

    console.dir(appointment, {
      depth: null,
    });

    if (!appointment) {
      throw new Error("No se encontró la cita creada.");
    }

    if (appointment.source !== "WHATSAPP_AI") {
      throw new Error(
        `Source inesperado: ${appointment.source}`,
      );
    }

    console.log("\n=== FULL FLOW PASSED ===");

    console.log(
      "IA → Agenda → selección → confirmación → cita real.",
    );
  } finally {
    await prisma.whatsAppConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        appointmentId: null,
      },
    });

    if (appointmentId) {
      await prisma.appointment.delete({
        where: {
          id: appointmentId,
        },
      });

      console.log("\n=== TEST APPOINTMENT DELETED ===");
      console.log(appointmentId);
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
    console.error("\nTEST_FULL_BOOKING_FLOW_ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });