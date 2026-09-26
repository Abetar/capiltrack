import { formatInTimeZone } from "date-fns-tz";

import { formatAppointmentDateTime } from "./formatAppointmentDateTime";

import type {
  AgentResponse,
  ConversationContext,
  ConversationState,
} from "./types/conversation";

type ResolveConversationStateInput = {
  message: string;
  context: ConversationContext;
};

type ResolveConversationStateResult = {
  handled: boolean;
  nextContext: ConversationContext;
  response: AgentResponse | null;
};

const DEFAULT_TIMEZONE = "America/Mexico_City";
const SLOTS_PER_PAGE = 3;

const AFFIRMATIVE_RESPONSES = new Set([
  "si",
  "sí",
  "s",
  "ok",
  "okay",
  "confirmo",
  "confirmar",
  "correcto",
  "va",
  "dale",
  "de acuerdo",
]);

const NEGATIVE_RESPONSES = new Set([
  "no",
  "n",
  "cancelar",
  "cancela",
  "mejor no",
]);

function normalizeMessage(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-MX")
    .replace(/[¡!¿?.]/g, "")
    .replace(/\s+/g, " ");
}

/*
 * Una opción numérica solamente es válida cuando TODO el
 * mensaje es un número.
 *
 * Ejemplos:
 *
 * "3"   -> 3
 * "03"  -> 3
 * "3pm" -> null
 * "3 pm" -> null
 * "3abc" -> null
 *
 * Esto evita que expresiones naturales de horario como
 * "3pm" sean confundidas con la opción número 3.
 */
function parseNumericOption(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) ? parsed : null;
}

function parseExplicitOption(value: string) {
  const match = value.match(
    /^(?:(?:quiero|elijo|escojo|selecciono|dame|prefiero|me quedo con)\s+)?(?:(?:el|la)\s+)?(?:numero|número|opcion|opción)\s+(\d+)$/,
  );

  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);

  return Number.isInteger(parsed) ? parsed : null;
}

function parseOrdinalOption(value: string, visibleOptionCount: number) {
  const ordinalOptions: Record<string, number> = {
    primero: 1,
    "el primero": 1,
    primera: 1,
    "la primera": 1,

    segundo: 2,
    "el segundo": 2,
    segunda: 2,
    "la segunda": 2,

    tercero: 3,
    "el tercero": 3,
    tercera: 3,
    "la tercera": 3,
  };

  const ordinalOption = ordinalOptions[value];

  if (ordinalOption !== undefined && ordinalOption <= visibleOptionCount) {
    return ordinalOption;
  }

  const isLastOption =
    value === "ultimo" ||
    value === "último" ||
    value === "el ultimo" ||
    value === "el último" ||
    value === "ultima" ||
    value === "última" ||
    value === "la ultima" ||
    value === "la última";

  if (isLastOption && visibleOptionCount > 0) {
    return visibleOptionCount;
  }

  return null;
}

function changeState(
  context: ConversationContext,
  state: ConversationState,
): ConversationContext {
  return {
    ...context,
    state,
  };
}

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

function formatStoredAppointment({
  startAt,
  timezone,
}: {
  startAt: string;
  timezone: string;
}) {
  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    return startAt;
  }

  const localDate = formatInTimeZone(date, timezone, "yyyy-MM-dd");

  const localTime = formatInTimeZone(date, timezone, "HH:mm");

  return formatAppointmentDateTime({
    date: localDate,
    time: localTime,
    timezone,
  });
}

function manageMenuResponse(context: ConversationContext): AgentResponse {
  const selectedAppointment = context.availableAppointments?.find(
    (appointment) => appointment.id === context.appointmentId,
  );

  const timezone =
    selectedAppointment?.timezone || context.timezone || DEFAULT_TIMEZONE;

  const appointmentDescription = selectedAppointment
    ? formatStoredAppointment({
        startAt: selectedAppointment.startAt,
        timezone,
      })
    : null;

  return {
    text: appointmentDescription
      ? `Tu cita es el ${appointmentDescription}.\n\n¿Qué deseas hacer?`
      : "¿Qué deseas hacer con tu cita?",
    options: [
      {
        id: "1",
        label: "Cambiar fecha u horario",
      },
      {
        id: "2",
        label: "Cancelar cita",
      },
      {
        id: "3",
        label: "Volver al menú",
      },
    ],
  };
}

function mainMenuResponse(): AgentResponse {
  return {
    text: "¿En qué te puedo ayudar?",
    options: [
      {
        id: "1",
        label: "Agendar una cita",
      },
      {
        id: "2",
        label: "Consultar o cambiar una cita",
      },
      {
        id: "3",
        label: "Cancelar una cita",
      },
      {
        id: "4",
        label: "Hablar con la clínica",
      },
    ],
  };
}

export function resolveConversationState({
  message,
  context,
}: ResolveConversationStateInput): ResolveConversationStateResult {
  const normalizedMessage = normalizeMessage(message);

  if (!normalizedMessage) {
    return {
      handled: true,
      nextContext: context,
      response: {
        text: "No pude identificar tu respuesta. Elige una de las opciones.",
      },
    };
  }

  /*
   * COMANDO GLOBAL DE NAVEGACIÓN
   */
  if (
    normalizedMessage === "menu" ||
    normalizedMessage === "menú" ||
    normalizedMessage === "inicio" ||
    normalizedMessage === "volver al menu" ||
    normalizedMessage === "volver al menú"
  ) {
    const nextContext: ConversationContext = {
      state: "MAIN_MENU",
      timezone: context.timezone,
      appointmentId: context.appointmentId,
    };

    return {
      handled: true,
      nextContext,
      response: mainMenuResponse(),
    };
  }

  if (context.state === "MAIN_MENU") {
    if (
      normalizedMessage === "1" ||
      normalizedMessage === "agendar" ||
      normalizedMessage === "agendar una cita"
    ) {
      return {
        handled: true,
        nextContext: changeState(context, "BOOK_SELECT_DATE"),
        response: {
          text: "Perfecto. ¿Para qué día te gustaría agendar tu cita?",
          requiresAiInterpretation: true,
        },
      };
    }

    if (
      normalizedMessage === "2" ||
      normalizedMessage === "consultar" ||
      normalizedMessage === "cambiar" ||
      normalizedMessage === "consultar o cambiar una cita"
    ) {
      return {
        handled: true,
        nextContext: changeState(context, "MANAGE_FIND_APPOINTMENT"),
        response: {
          text: "Claro. Voy a buscar tus próximas citas.",
        },
      };
    }

    if (
      normalizedMessage === "3" ||
      normalizedMessage === "cancelar" ||
      normalizedMessage === "cancelar una cita"
    ) {
      return {
        handled: true,
        nextContext: {
          ...context,
          state: "MANAGE_FIND_APPOINTMENT",
        },
        response: {
          text: "Claro. Voy a buscar la cita que deseas cancelar.",
        },
      };
    }

    if (
      normalizedMessage === "4" ||
      normalizedMessage === "hablar con la clínica" ||
      normalizedMessage === "hablar con el doctor" ||
      normalizedMessage === "doctor"
    ) {
      return {
        handled: true,
        nextContext: changeState(context, "WAITING_FOR_HUMAN"),
        response: {
          text: "De acuerdo. Avisaré a la clínica para que puedan continuar contigo.",
          requiresHuman: true,
        },
      };
    }

    return {
      handled: false,
      nextContext: context,
      response: null,
    };
  }

  if (context.state === "MANAGE_FIND_APPOINTMENT") {
    const appointments = context.availableAppointments ?? [];

    if (appointments.length === 0) {
      return {
        handled: false,
        nextContext: context,
        response: null,
      };
    }

    const selectedIndex = parseNumericOption(normalizedMessage);

    if (
      selectedIndex !== null &&
      selectedIndex >= 1 &&
      selectedIndex <= appointments.length
    ) {
      const selectedAppointment = appointments[selectedIndex - 1];

      const nextContext: ConversationContext = {
        ...context,
        state: "MANAGE_MENU",
        appointmentId: selectedAppointment.id,
      };

      return {
        handled: true,
        nextContext,
        response: manageMenuResponse(nextContext),
      };
    }

    return {
      handled: true,
      nextContext: context,
      response: {
        text: "Elige una de tus próximas citas.",
        options: appointments.map((appointment, index) => ({
          id: String(index + 1),
          label: formatStoredAppointment({
            startAt: appointment.startAt,
            timezone:
              appointment.timezone || context.timezone || DEFAULT_TIMEZONE,
          }),
        })),
      },
    };
  }

  if (context.state === "MANAGE_MENU") {
    if (normalizedMessage === "1") {
      return {
        handled: true,
        nextContext: {
          ...context,
          state: "RESCHEDULE_SELECT_DATE",
          requestedDate: undefined,
          requestedStartTime: undefined,
          lastOfferedSlotStartAt: undefined,
          availableSlots: undefined,
          slotPage: undefined,
        },
        response: {
          text: "Claro. ¿Para qué día te gustaría cambiar tu cita?",
          requiresAiInterpretation: true,
        },
      };
    }

    if (normalizedMessage === "2") {
      return {
        handled: true,
        nextContext: {
          ...context,
          state: "CANCEL_CONFIRM",
        },
        response: {
          text: "¿Confirmas que deseas cancelar esta cita?",
          options: [
            {
              id: "1",
              label: "Sí, cancelar",
            },
            {
              id: "2",
              label: "No cancelar",
            },
          ],
        },
      };
    }

    if (normalizedMessage === "3") {
      return {
        handled: true,
        nextContext: {
          state: "MAIN_MENU",
          timezone: context.timezone,
        },
        response: mainMenuResponse(),
      };
    }

    return {
      handled: true,
      nextContext: context,
      response: manageMenuResponse(context),
    };
  }

  if (
    context.state === "BOOK_SELECT_TIME" ||
    context.state === "RESCHEDULE_SELECT_TIME"
  ) {
    const isReschedule = context.state === "RESCHEDULE_SELECT_TIME";

    const slots = context.availableSlots ?? [];

    const slotPage = context.slotPage ?? 0;

    const pageStart = slotPage * SLOTS_PER_PAGE;

    const visibleSlots = slots.slice(pageStart, pageStart + SLOTS_PER_PAGE);

    const hasMoreSlots = pageStart + visibleSlots.length < slots.length;

    const moreOptionId = hasMoreSlots ? String(visibleSlots.length + 1) : null;

    const otherDayOptionId = String(
      visibleSlots.length + (hasMoreSlots ? 2 : 1),
    );

    /*
     * Resolvemos primero selecciones explícitas como:
     *
     * "4"
     * "opcion 4"
     * "opción 4"
     * "quiero la opción 4"
     * "el número 5"
     *
     * Esto permite que las opciones auxiliares (Ver más horarios /
     * Elegir otro día) utilicen el mismo parser que los horarios,
     * sin volver a confundir expresiones como "3pm" con la opción 3.
     */
    const explicitOptionId =
      parseNumericOption(normalizedMessage) ??
      parseExplicitOption(normalizedMessage);

    const isMoreRequest =
      (moreOptionId !== null &&
        explicitOptionId !== null &&
        String(explicitOptionId) === moreOptionId) ||
      normalizedMessage === "ver más horarios" ||
      normalizedMessage === "ver mas horarios" ||
      normalizedMessage === "más horarios" ||
      normalizedMessage === "mas horarios";

    if (isMoreRequest && hasMoreSlots) {
      const nextPage = slotPage + 1;

      const nextPageStart = nextPage * SLOTS_PER_PAGE;

      const nextVisibleSlots = slots.slice(
        nextPageStart,
        nextPageStart + SLOTS_PER_PAGE,
      );

      const nextHasMoreSlots =
        nextPageStart + nextVisibleSlots.length < slots.length;

      return {
        handled: true,
        nextContext: {
          ...context,
          slotPage: nextPage,
        },
        response: {
          text: nextHasMoreSlots
            ? "También tengo estos horarios disponibles:"
            : "Estos son los últimos horarios disponibles:",
          options: [
            ...nextVisibleSlots.map((slot, index) => ({
              id: String(index + 1),
              label: formatTime(slot.localStartTime),
            })),
            ...(nextHasMoreSlots
              ? [
                  {
                    id: String(nextVisibleSlots.length + 1),
                    label: "Ver más horarios",
                  },
                ]
              : []),
            {
              id: String(nextVisibleSlots.length + (nextHasMoreSlots ? 2 : 1)),
              label: "Elegir otro día",
            },
          ],
        },
      };
    }

    const isOtherDayRequest =
      (explicitOptionId !== null &&
        String(explicitOptionId) === otherDayOptionId) ||
      normalizedMessage === "otro día" ||
      normalizedMessage === "otro dia" ||
      normalizedMessage === "elegir otro día" ||
      normalizedMessage === "elegir otro dia";

    if (isOtherDayRequest) {
      return {
        handled: true,
        nextContext: {
          ...context,
          state: isReschedule ? "RESCHEDULE_SELECT_DATE" : "BOOK_SELECT_DATE",
          requestedDate: undefined,
          requestedStartTime: undefined,
          lastOfferedSlotStartAt: undefined,
          availableSlots: undefined,
          slotPage: undefined,
        },
        response: {
          text: "Claro. ¿Qué otro día te gustaría?",
          requiresAiInterpretation: true,
        },
      };
    }

    /*
     * IMPORTANTE:
     *
     * Antes se utilizaba:
     *
     * Number.parseInt(normalizedMessage, 10)
     *
     * Eso provocaba que "3pm" se
     * convirtiera en 3 y seleccionara
     * accidentalmente la tercera opción.
     */
    const selectedIndex =
      explicitOptionId ??
      parseOrdinalOption(normalizedMessage, visibleSlots.length);

    if (
      selectedIndex !== null &&
      selectedIndex >= 1 &&
      selectedIndex <= visibleSlots.length
    ) {
      const selectedSlot = visibleSlots[selectedIndex - 1];

      const formattedDateTime = formatAppointmentDateTime({
        date: selectedSlot.localDate,
        time: selectedSlot.localStartTime,
        timezone: context.timezone ?? DEFAULT_TIMEZONE,
      });

      return {
        handled: true,
        nextContext: {
          ...context,
          state: isReschedule ? "RESCHEDULE_CONFIRM" : "BOOK_CONFIRM",
          requestedDate: selectedSlot.localDate,
          requestedStartTime: selectedSlot.localStartTime,
          lastOfferedSlotStartAt: selectedSlot.startAt,
        },
        response: {
          text: isReschedule
            ? `¿Confirmas cambiar tu cita al ${formattedDateTime}?`
            : `¿Confirmas tu cita el ${formattedDateTime}?`,
          options: isReschedule
            ? [
                {
                  id: "1",
                  label: "Confirmar cambio",
                },
                {
                  id: "2",
                  label: "Elegir otro horario",
                },
                {
                  id: "3",
                  label: "Cancelar cambio",
                },
              ]
            : [
                {
                  id: "1",
                  label: "Confirmar",
                },
                {
                  id: "2",
                  label: "Elegir otro horario",
                },
                {
                  id: "3",
                  label: "Cancelar",
                },
              ],
        },
      };
    }

    /*
     * No fue una opción determinística.
     *
     * Dejamos pasar el mensaje hacia
     * interpretPatientInput(), que puede
     * entender expresiones como:
     *
     * "3pm"
     * "a las 3 de la tarde"
     * "quiero el de las 3"
     */
    return {
      handled: false,
      nextContext: context,
      response: null,
    };
  }

  if (
    context.state === "BOOK_CONFIRM" ||
    context.state === "RESCHEDULE_CONFIRM" ||
    context.state === "CANCEL_CONFIRM"
  ) {
    if (context.state === "BOOK_CONFIRM" && normalizedMessage === "2") {
      return {
        handled: true,
        nextContext: {
          ...context,
          state: "BOOK_SELECT_TIME",
          requestedStartTime: undefined,
          lastOfferedSlotStartAt: undefined,
        },
        response: (() => {
          const slots = context.availableSlots ?? [];

          const slotPage = context.slotPage ?? 0;

          const pageStart = slotPage * SLOTS_PER_PAGE;

          const visibleSlots = slots.slice(
            pageStart,
            pageStart + SLOTS_PER_PAGE,
          );

          const hasMoreSlots = pageStart + visibleSlots.length < slots.length;

          return {
            text: "Claro. Elige otro horario disponible.",
            options: [
              ...visibleSlots.map((slot, index) => ({
                id: String(index + 1),
                label: formatTime(slot.localStartTime),
              })),
              ...(hasMoreSlots
                ? [
                    {
                      id: String(visibleSlots.length + 1),
                      label: "Ver más horarios",
                    },
                  ]
                : []),
              {
                id: String(visibleSlots.length + (hasMoreSlots ? 2 : 1)),
                label: "Elegir otro día",
              },
            ],
          };
        })(),
      };
    }

    if (context.state === "BOOK_CONFIRM" && normalizedMessage === "3") {
      return {
        handled: true,
        nextContext: {
          state: "MAIN_MENU",
          timezone: context.timezone,
        },
        response: {
          ...mainMenuResponse(),
          text: "No hay problema. No realicé ningún cambio.\n\n¿En qué más te puedo ayudar?",
        },
      };
    }

    if (context.state === "RESCHEDULE_CONFIRM" && normalizedMessage === "2") {
      return {
        handled: true,
        nextContext: {
          ...context,
          state: "RESCHEDULE_SELECT_TIME",
          requestedStartTime: undefined,
          lastOfferedSlotStartAt: undefined,
        },
        response: (() => {
          const slots = context.availableSlots ?? [];

          const slotPage = context.slotPage ?? 0;

          const pageStart = slotPage * SLOTS_PER_PAGE;

          const visibleSlots = slots.slice(
            pageStart,
            pageStart + SLOTS_PER_PAGE,
          );

          const hasMoreSlots = pageStart + visibleSlots.length < slots.length;

          return {
            text: "Claro. Elige otro horario disponible.",
            options: [
              ...visibleSlots.map((slot, index) => ({
                id: String(index + 1),
                label: formatTime(slot.localStartTime),
              })),
              ...(hasMoreSlots
                ? [
                    {
                      id: String(visibleSlots.length + 1),
                      label: "Ver más horarios",
                    },
                  ]
                : []),
              {
                id: String(visibleSlots.length + (hasMoreSlots ? 2 : 1)),
                label: "Elegir otro día",
              },
            ],
          };
        })(),
      };
    }

    if (context.state === "RESCHEDULE_CONFIRM" && normalizedMessage === "3") {
      const nextContext: ConversationContext = {
        ...context,
        state: "MANAGE_MENU",
        requestedDate: undefined,
        requestedStartTime: undefined,
        lastOfferedSlotStartAt: undefined,
        availableSlots: undefined,
      };

      return {
        handled: true,
        nextContext,
        response: {
          ...manageMenuResponse(nextContext),
          text: "No hay problema. No realicé ningún cambio.\n\n¿Qué deseas hacer con tu cita?",
        },
      };
    }

    if (context.state === "CANCEL_CONFIRM" && normalizedMessage === "2") {
      return {
        handled: true,
        nextContext: {
          ...context,
          state: "MANAGE_MENU",
        },
        response: manageMenuResponse({
          ...context,
          state: "MANAGE_MENU",
        }),
      };
    }

    if (
      normalizedMessage === "1" ||
      AFFIRMATIVE_RESPONSES.has(normalizedMessage)
    ) {
      return {
        handled: true,
        nextContext: context,
        response: {
          text: "CONFIRMED",
        },
      };
    }

    if (NEGATIVE_RESPONSES.has(normalizedMessage)) {
      if (context.state === "RESCHEDULE_CONFIRM") {
        const nextContext: ConversationContext = {
          ...context,
          state: "MANAGE_MENU",
          requestedDate: undefined,
          requestedStartTime: undefined,
          lastOfferedSlotStartAt: undefined,
          availableSlots: undefined,
        };

        return {
          handled: true,
          nextContext,
          response: {
            ...manageMenuResponse(nextContext),
            text: "No hay problema. No realicé ningún cambio.\n\n¿Qué deseas hacer con tu cita?",
          },
        };
      }

      return {
        handled: true,
        nextContext: {
          state: "MAIN_MENU",
          timezone: context.timezone,
        },
        response: {
          ...mainMenuResponse(),
          text: "No hay problema. No realicé ningún cambio.\n\n¿En qué más te puedo ayudar?",
        },
      };
    }

    return {
      handled: false,
      nextContext: context,
      response: null,
    };
  }

  if (context.state === "WAITING_FOR_HUMAN") {
    return {
      handled: true,
      nextContext: context,
      response: null,
    };
  }

  return {
    handled: false,
    nextContext: context,
    response: null,
  };
}

export function getMainMenuResponse() {
  return mainMenuResponse();
}
