import { getSuggestedAvailableSlots } from "@/lib/appointments/getSuggestedAvailableSlots";
import { prisma } from "@/lib/db/prisma";

import type { AiInterpretedInput } from "./ai/types";
import type {
  AgentResponse,
  ConversationContext,
  ConversationState,
} from "./types/conversation";

type BookingFlowMode =
  | "BOOK"
  | "RESCHEDULE";

type BuildBookingOptionsInput = {
  clinicId: string;
  interpretation: AiInterpretedInput;
  context: ConversationContext;
  mode?: BookingFlowMode;
};

function formatTime(value: string) {
  const [hoursText, minutes] = value.split(":");
  const hours = Number(hoursText);

  if (!Number.isInteger(hours)) {
    return value;
  }

  const period = hours >= 12 ? "p. m." : "a. m.";
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${minutes} ${period}`;
}

function filterByTimePreference({
  slots,
  interpretation,
}: {
  slots: Array<{
    startAtIso: string;
    endAtIso: string;
    localDate: string;
    localStartTime: string;
    localEndTime: string;
    timezone: string;
  }>;
  interpretation: AiInterpretedInput;
}) {
  return slots.filter((slot) => {
    const hour = Number(
      slot.localStartTime.split(":")[0],
    );

    if (interpretation.timePreference === "MORNING") {
      return hour < 12;
    }

    if (
      interpretation.timePreference === "AFTERNOON"
    ) {
      return hour >= 12 && hour < 18;
    }

    if (
      interpretation.timePreference === "EVENING"
    ) {
      return hour >= 18;
    }

    return true;
  });
}

function getStates(mode: BookingFlowMode): {
  selectDateState: ConversationState;
  selectTimeState: ConversationState;
} {
  if (mode === "RESCHEDULE") {
    return {
      selectDateState: "RESCHEDULE_SELECT_DATE",
      selectTimeState: "RESCHEDULE_SELECT_TIME",
    };
  }

  return {
    selectDateState: "BOOK_SELECT_DATE",
    selectTimeState: "BOOK_SELECT_TIME",
  };
}

function validateIntent({
  mode,
  interpretation,
}: {
  mode: BookingFlowMode;
  interpretation: AiInterpretedInput;
}) {
  if (
    mode === "BOOK" &&
    interpretation.intent !== "BOOK_APPOINTMENT"
  ) {
    throw new Error(
      "BOOK mode requires BOOK_APPOINTMENT intent",
    );
  }

  if (
    mode === "RESCHEDULE" &&
    interpretation.intent !== "RESCHEDULE_APPOINTMENT" &&
    interpretation.intent !== "BOOK_APPOINTMENT"
  ) {
    throw new Error(
      "RESCHEDULE mode requires RESCHEDULE_APPOINTMENT or BOOK_APPOINTMENT intent",
    );
  }
}

export async function buildBookingOptions({
  clinicId,
  interpretation,
  context,
  mode = "BOOK",
}: BuildBookingOptionsInput): Promise<{
  nextContext: ConversationContext;
  response: AgentResponse;
}> {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  validateIntent({
    mode,
    interpretation,
  });

  const {
    selectDateState,
    selectTimeState,
  } = getStates(mode);

  if (!interpretation.resolvedDate) {
    return {
      nextContext: {
        ...context,
        state: selectDateState,
      },
      response: {
        text: interpretation.isAmbiguous
          ? "Necesito confirmar la fecha antes de buscar horarios. ¿Qué día te gustaría?"
          : mode === "RESCHEDULE"
            ? "¿Para qué día te gustaría cambiar tu cita?"
            : "¿Para qué día te gustaría agendar tu cita?",
        requiresAiInterpretation: true,
      },
    };
  }

  const settings =
    await prisma.scheduleSettings.findUnique({
      where: {
        clinicId,
      },
      select: {
        defaultAppointmentMinutes: true,
      },
    });

  const appointmentMinutes =
    context.appointmentMinutes ??
    settings?.defaultAppointmentMinutes ??
    60;

  const availability =
    await getSuggestedAvailableSlots({
      clinicId,
      requestedDate: interpretation.resolvedDate,
      appointmentMinutes,
      requestedStartTime:
        interpretation.resolvedStartTime,
      afterTime: interpretation.afterTime,
      beforeTime: interpretation.beforeTime,
      maxSlots: 24,
      maxDaysToSearch: 30,
    });

  if (!availability) {
    return {
      nextContext: {
        ...context,
        state: selectDateState,
        requestedDate: interpretation.resolvedDate,
        appointmentMinutes,
        availableSlots: [],
      },
      response: {
        text:
          "No encontré disponibilidad dentro de los próximos 30 días. Puedes elegir otra fecha o pedir hablar con la clínica.",
        options: [
          {
            id: "1",
            label: "Elegir otra fecha",
          },
          {
            id: "2",
            label: "Hablar con la clínica",
          },
        ],
      },
    };
  }

  const preferredSlots = filterByTimePreference({
    slots: availability.slots,
    interpretation,
  });

  const slots =
    preferredSlots.length > 0
      ? preferredSlots
      : availability.slots;

  const limitedSlots = slots.slice(0, 3);

  const nextContext: ConversationContext = {
    ...context,
    state: selectTimeState,
    requestedDate: availability.resolvedDate,
    requestedStartTime:
      interpretation.resolvedStartTime ?? undefined,
    appointmentMinutes,
    availableSlots: limitedSlots.map((slot) => ({
      startAt: slot.startAtIso,
      endAt: slot.endAtIso,
      localDate: slot.localDate,
      localStartTime: slot.localStartTime,
      localEndTime: slot.localEndTime,
    })),
  };

  const options = limitedSlots.map(
    (slot, index) => ({
      id: String(index + 1),
      label: formatTime(slot.localStartTime),
    }),
  );

  const requestedDateChanged =
    availability.resolvedDate !==
    interpretation.resolvedDate;

  let text: string;

  if (requestedDateChanged) {
    text =
      "No encontré disponibilidad en la fecha solicitada. Esta es la siguiente fecha con espacios disponibles:";
  } else if (
    interpretation.resolvedStartTime &&
    !availability.exactMatch
  ) {
    text =
      "Ese horario no está disponible. Tengo estas alternativas:";
  } else {
    text =
      mode === "RESCHEDULE"
        ? "Tengo estos horarios disponibles para cambiar tu cita:"
        : "Tengo estos horarios disponibles:";
  }

  return {
    nextContext,
    response: {
      text,
      options: [
        ...options,
        {
          id: "4",
          label: "Elegir otro día",
        },
      ],
    },
  };
}