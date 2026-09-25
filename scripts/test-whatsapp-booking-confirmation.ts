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

  /*
   * Usamos un teléfono nuevo para evitar reutilizar
   * accidentalmente otra conversación de pruebas.
   */
  const phoneNumber = `+52133${Date.now()
    .toString()
    .slice(-8)}`;

  const conversation = await getOrCreateConversation({
    clinicId: clinic.id,
    phoneNumber,
    displayName: "Paciente prueba WhatsApp",
  });

  /*
   * Simulamos que el paciente ya:
   *
   * 1. pidió una cita,
   * 2. recibió horarios,
   * 3. eligió el lunes 17 de agosto a las 09:00,
   * 4. está viendo la pantalla de confirmación.
   *
   * Elegimos una fecha futura para que la validación de Agenda
   * no falle por minimumBookingNoticeHours.
   */
  const selectedStartAt = new Date(
    "2026-08-17T15:00:00.000Z",
  );

  const selectedEndAt = new Date(
    "2026-08-17T16:00:00.000Z",
  );

  await saveConversationContext({
    clinicId: clinic.id,
    conversationId: conversation.id,
    context: {
      state: "BOOK_CONFIRM",
      requestedDate: "2026-08-17",
      requestedStartTime: "09:00",
      appointmentMinutes: 60,
      lastOfferedSlotStartAt:
        selectedStartAt.toISOString(),
      availableSlots: [
        {
          startAt: selectedStartAt.toISOString(),
          endAt: selectedEndAt.toISOString(),
          localDate: "2026-08-17",
          localStartTime: "09:00",
          localEndTime: "10:00",
        },
      ],
    },
  });

  let appointmentId: string | null = null;

  try {
    console.log("\n=== BEFORE CONFIRMATION ===");

    console.dir({
      clinic: clinic.name,
      conversationId: conversation.id,
      phoneNumber,
      selectedDate: "2026-08-17",
      selectedTime: "09:00",
    });

    const result =
      await processPersistedConversationInput({
        clinicId: clinic.id,
        conversationId: conversation.id,
        message: "1",
      });

    console.log("\n=== AGENT RESULT ===");

    console.dir(result, {
      depth: null,
    });

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
          clinicId: true,
          patientName: true,
          patientPhone: true,
          startAt: true,
          endAt: true,
          status: true,
          source: true,
        },
      });

    console.log("\n=== CREATED APPOINTMENT ===");

    console.dir(appointment, {
      depth: null,
    });

    if (!appointment) {
      throw new Error(
        "La cita no fue encontrada después de crearla.",
      );
    }

    if (appointment.source !== "WHATSAPP_AI") {
      throw new Error(
        `Appointment source incorrecto: ${appointment.source}`,
      );
    }

    console.log("\n=== TEST PASSED ===");
    console.log(
      "La cita fue creada correctamente desde el flujo del agente.",
    );
  } finally {
    /*
     * Limpiamos primero la relación desde WhatsAppConversation
     * para no dejar referencias al Appointment de prueba.
     */
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
    console.error(
      "\nTEST_WHATSAPP_BOOKING_CONFIRMATION_ERROR",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });