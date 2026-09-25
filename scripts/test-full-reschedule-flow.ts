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
    displayName: "Paciente flujo reagendado",
  });

  /*
   * Cita original:
   * lunes 17 de agosto, 09:00 CDMX.
   */
  const originalStartAt = new Date(
    "2026-08-17T15:00:00.000Z",
  );

  const originalEndAt = new Date(
    "2026-08-17T16:00:00.000Z",
  );

  const appointment = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,

      patientName: "Paciente flujo reagendado",
      patientPhone: phoneNumber,

      startAt: originalStartAt,
      endAt: originalEndAt,

      timezone: "America/Mexico_City",

      status: "CONFIRMED",
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
        `Estado inesperado después de consultar: ${searchResult.nextContext.state}`,
      );
    }

    if (
      searchResult.nextContext.appointmentId !==
      appointment.id
    ) {
      throw new Error(
        "La cita seleccionada no coincide con la original.",
      );
    }

    console.log("\n=== STEP 2 - CAMBIAR CITA ===");

    const changeResult =
      await processPersistedConversationInput({
        clinicId: clinic.id,
        conversationId: conversation.id,
        message: "1",
      });

    console.dir(changeResult, {
      depth: null,
    });

    if (
      changeResult.nextContext.state !==
      "RESCHEDULE_SELECT_DATE"
    ) {
      throw new Error(
        `Estado inesperado al iniciar reagendado: ${changeResult.nextContext.state}`,
      );
    }

    if (
      changeResult.nextContext.appointmentId !==
      appointment.id
    ) {
      throw new Error(
        "Se perdió appointmentId al iniciar reagendado.",
      );
    }

    console.log(
      "\n=== STEP 3 - NATURAL LANGUAGE DATE ===",
    );

    /*
     * Pedimos una fecha concreta para que el test no
     * dependa de cómo el modelo interprete "mañana".
     *
     * Martes 18 está dentro del horario semanal configurado.
     */
    const dateResult =
      await processPersistedConversationInput({
        clinicId: clinic.id,
        conversationId: conversation.id,
        message:
          "Quiero moverla al martes 18 de agosto por la mañana",
      });

    console.dir(dateResult, {
      depth: null,
    });

    if (
      dateResult.nextContext.state !==
      "RESCHEDULE_SELECT_TIME"
    ) {
      throw new Error(
        `Estado inesperado después de interpretar fecha: ${dateResult.nextContext.state}`,
      );
    }

    if (
      dateResult.nextContext.appointmentId !==
      appointment.id
    ) {
      throw new Error(
        "Se perdió appointmentId después de interpretar la fecha.",
      );
    }

    const availableSlots =
      dateResult.nextContext.availableSlots ?? [];

    if (availableSlots.length === 0) {
      throw new Error(
        "No se ofrecieron horarios para reagendar.",
      );
    }

    console.log(
      "\n=== STEP 4 - SELECT FIRST SLOT ===",
    );

    const slotResult =
      await processPersistedConversationInput({
        clinicId: clinic.id,
        conversationId: conversation.id,
        message: "1",
      });

    console.dir(slotResult, {
      depth: null,
    });

    if (
      slotResult.nextContext.state !==
      "RESCHEDULE_CONFIRM"
    ) {
      throw new Error(
        `Estado inesperado después de seleccionar slot: ${slotResult.nextContext.state}`,
      );
    }

    if (
      slotResult.nextContext.appointmentId !==
      appointment.id
    ) {
      throw new Error(
        "Se perdió appointmentId al seleccionar el nuevo horario.",
      );
    }

    if (slotResult.requiresAiInterpretation) {
      throw new Error(
        "Seleccionar el nuevo horario no debería consumir IA.",
      );
    }

    const selectedSlot =
      slotResult.nextContext.availableSlots?.find(
        (slot) =>
          slot.startAt ===
          slotResult.nextContext.lastOfferedSlotStartAt,
      );

    if (!selectedSlot) {
      throw new Error(
        "No se pudo determinar el slot seleccionado.",
      );
    }

    console.log(
      "\n=== STEP 5 - CONFIRM RESCHEDULE ===",
    );

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
        "Confirmar el reagendado no debería consumir IA.",
      );
    }

    if (
      confirmationResult.nextContext.state !==
      "MAIN_MENU"
    ) {
      throw new Error(
        `Estado inesperado después de reagendar: ${confirmationResult.nextContext.state}`,
      );
    }

    const updatedAppointment =
      await prisma.appointment.findUnique({
        where: {
          id: appointment.id,
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          timezone: true,
          status: true,
        },
      });

    console.log("\n=== APPOINTMENT AFTER ===");

    console.dir(updatedAppointment, {
      depth: null,
    });

    if (!updatedAppointment) {
      throw new Error(
        "No se encontró la cita después del reagendado.",
      );
    }

    if (
      updatedAppointment.startAt.toISOString() !==
      selectedSlot.startAt
    ) {
      throw new Error(
        "La nueva fecha/hora no coincide con el slot seleccionado.",
      );
    }

    if (
      updatedAppointment.endAt.toISOString() !==
      selectedSlot.endAt
    ) {
      throw new Error(
        "La nueva hora de fin no coincide con el slot seleccionado.",
      );
    }

    /*
     * Reagendar no cambia CONFIRMED a PENDING.
     */
    if (updatedAppointment.status !== "CONFIRMED") {
      throw new Error(
        `Status inesperado después del reagendado: ${updatedAppointment.status}`,
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

    const rescheduledEvent = events.find(
      (event) => event.type === "RESCHEDULED",
    );

    if (!rescheduledEvent) {
      throw new Error(
        "No se creó AppointmentEvent RESCHEDULED.",
      );
    }

    if (
      rescheduledEvent.source !== "WHATSAPP_AI"
    ) {
      throw new Error(
        `Event source inesperado: ${rescheduledEvent.source}`,
      );
    }

    if (rescheduledEvent.actorUserId !== null) {
      throw new Error(
        "actorUserId debería ser null para reagendado mediante agente.",
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

    if (
      updatedConversation?.appointmentId !==
      appointment.id
    ) {
      throw new Error(
        "La conversación debería seguir vinculada a la misma Appointment.",
      );
    }

    if (
      updatedConversation.currentIntent !==
      "RESCHEDULE_APPOINTMENT"
    ) {
      throw new Error(
        `Intent inesperado: ${updatedConversation.currentIntent}`,
      );
    }

    console.log(
      "\n=== FULL RESCHEDULE FLOW PASSED ===",
    );

    console.log(
      "Consultar → cambiar → lenguaje natural → disponibilidad → seleccionar → confirmar → misma Appointment reagendada.",
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
      "\nTEST_FULL_RESCHEDULE_FLOW_ERROR",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });