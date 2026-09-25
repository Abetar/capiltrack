import { processConversationInput } from "../lib/agent/processConversationInput";
import type { ConversationContext } from "../lib/agent/types/conversation";

const originalAppointmentId =
  "test-original-appointment-id";

const context: ConversationContext = {
  state: "RESCHEDULE_SELECT_TIME",

  timezone: "America/Mexico_City",

  appointmentId: originalAppointmentId,

  requestedDate: "2026-08-18",
  appointmentMinutes: 60,

  availableAppointments: [
    {
      id: originalAppointmentId,
      startAt: "2026-08-17T15:00:00.000Z",
      endAt: "2026-08-17T16:00:00.000Z",
      timezone: "America/Mexico_City",
      status: "CONFIRMED",
    },
  ],

  availableSlots: [
    {
      startAt: "2026-08-18T15:00:00.000Z",
      endAt: "2026-08-18T16:00:00.000Z",
      localDate: "2026-08-18",
      localStartTime: "09:00",
      localEndTime: "10:00",
    },
    {
      startAt: "2026-08-18T17:00:00.000Z",
      endAt: "2026-08-18T18:00:00.000Z",
      localDate: "2026-08-18",
      localStartTime: "11:00",
      localEndTime: "12:00",
    },
    {
      startAt: "2026-08-18T19:00:00.000Z",
      endAt: "2026-08-18T20:00:00.000Z",
      localDate: "2026-08-18",
      localStartTime: "13:00",
      localEndTime: "14:00",
    },
  ],
};

function main() {
  console.log("\n=== BEFORE ===");

  console.dir(context, {
    depth: null,
  });

  const result = processConversationInput({
    message: "2",
    context,
  });

  console.log(
    "\n=== AFTER SELECTING OPTION 2 ===",
  );

  console.dir(result, {
    depth: null,
  });

  if (
    result.nextContext.state !==
    "RESCHEDULE_CONFIRM"
  ) {
    throw new Error(
      `Estado inesperado: ${result.nextContext.state}`,
    );
  }

  if (
    result.nextContext.appointmentId !==
    originalAppointmentId
  ) {
    throw new Error(
      "Se perdió el appointmentId de la cita original.",
    );
  }

  if (
    result.nextContext.requestedDate !==
    "2026-08-18"
  ) {
    throw new Error(
      `requestedDate inesperado: ${result.nextContext.requestedDate}`,
    );
  }

  if (
    result.nextContext.requestedStartTime !==
    "11:00"
  ) {
    throw new Error(
      `requestedStartTime inesperado: ${result.nextContext.requestedStartTime}`,
    );
  }

  if (
    result.nextContext.lastOfferedSlotStartAt !==
    "2026-08-18T17:00:00.000Z"
  ) {
    throw new Error(
      "No se guardó correctamente el slot seleccionado.",
    );
  }

  if (!result.handledDeterministically) {
    throw new Error(
      "La selección debería resolverse determinísticamente.",
    );
  }

  if (result.requiresAiInterpretation) {
    throw new Error(
      "Seleccionar un horario de reagendado no debería consumir IA.",
    );
  }

  console.log("\n=== TEST PASSED ===");

  console.log(
    "El nuevo slot fue seleccionado, appointmentId se conservó y no se utilizó IA.",
  );
}

try {
  main();
} catch (error) {
  console.error(
    "\nTEST_RESCHEDULE_SLOT_SELECTION_ERROR",
  );

  console.error(error);

  process.exitCode = 1;
}