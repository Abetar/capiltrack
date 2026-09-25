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
    displayName: "Paciente flujo cancelación",
  });

  const appointment = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,

      patientName: "Paciente flujo cancelación",
      patientPhone: phoneNumber,

      startAt: new Date("2026-08-20T15:00:00.000Z"),
      endAt: new Date("2026-08-20T16:00:00.000Z"),

      timezone: "America/Mexico_City",

      status: "PENDING",
      source: "WHATSAPP_AI",
    },
  });

  try {
    await saveConversationContext({
      clinicId: clinic.id,
      conversationId: conversation.id,
      context: {
        state: "MAIN_MENU",
      },
    });

    console.log("\n=== STEP 1 - CONSULTAR CITA ===");

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
      searchResult.nextContext.state !== "MANAGE_MENU"
    ) {
      throw new Error(
        `Estado inesperado después de buscar cita: ${searchResult.nextContext.state}`,
      );
    }

    if (
      searchResult.nextContext.appointmentId !==
      appointment.id
    ) {
      throw new Error(
        "La cita encontrada no coincide con la cita de prueba.",
      );
    }

    console.log("\n=== STEP 2 - CANCELAR ===");

    const cancelMenuResult =
      await processPersistedConversationInput({
        clinicId: clinic.id,
        conversationId: conversation.id,
        message: "2",
      });

    console.dir(cancelMenuResult, {
      depth: null,
    });

    if (
      cancelMenuResult.nextContext.state !==
      "CANCEL_CONFIRM"
    ) {
      throw new Error(
        `Estado inesperado antes de confirmar cancelación: ${cancelMenuResult.nextContext.state}`,
      );
    }

    if (cancelMenuResult.requiresAiInterpretation) {
      throw new Error(
        "Entrar a confirmación de cancelación no debería consumir IA.",
      );
    }

    console.log("\n=== STEP 3 - CONFIRMAR CANCELACIÓN ===");

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
        "Confirmar cancelación no debería consumir IA.",
      );
    }

    if (
      confirmationResult.nextContext.state !== "MAIN_MENU"
    ) {
      throw new Error(
        `Estado inesperado después de cancelar: ${confirmationResult.nextContext.state}`,
      );
    }

    const updatedAppointment =
      await prisma.appointment.findUnique({
        where: {
          id: appointment.id,
        },
        select: {
          id: true,
          status: true,
          cancelledAt: true,
        },
      });

    console.log("\n=== APPOINTMENT AFTER ===");

    console.dir(updatedAppointment, {
      depth: null,
    });

    if (!updatedAppointment) {
      throw new Error(
        "No se encontró la cita después de cancelarla.",
      );
    }

    if (updatedAppointment.status !== "CANCELLED") {
      throw new Error(
        `Status inesperado: ${updatedAppointment.status}`,
      );
    }

    if (!updatedAppointment.cancelledAt) {
      throw new Error(
        "cancelledAt no fue establecido.",
      );
    }

    const events =
      await prisma.appointmentEvent.findMany({
        where: {
          appointmentId: appointment.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          type: true,
          source: true,
          actorUserId: true,
          message: true,
          metadata: true,
        },
      });

    console.log("\n=== APPOINTMENT EVENTS ===");

    console.dir(events, {
      depth: null,
    });

    const cancellationEvent = events.find(
      (event) => event.type === "CANCELLED",
    );

    if (!cancellationEvent) {
      throw new Error(
        "No se encontró el AppointmentEvent de cancelación.",
      );
    }

    if (
      cancellationEvent.source !== "WHATSAPP_AI"
    ) {
      throw new Error(
        `Event source inesperado: ${cancellationEvent.source}`,
      );
    }

    if (cancellationEvent.actorUserId !== null) {
      throw new Error(
        "actorUserId debería ser null para cancelación por agente.",
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

    if (updatedConversation?.appointmentId !== null) {
      throw new Error(
        "La conversación no debería seguir vinculada a la cita cancelada.",
      );
    }

    console.log("\n=== FULL CANCELLATION FLOW PASSED ===");

    console.log(
      "Consulta → cancelar → confirmar → Appointment CANCELLED → AppointmentEvent WHATSAPP_AI.",
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

    await prisma.appointment.delete({
      where: {
        id: appointment.id,
      },
    });

    console.log("\n=== TEST APPOINTMENT DELETED ===");
    console.log(appointment.id);

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
      "\nTEST_FULL_CANCELLATION_FLOW_ERROR",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });