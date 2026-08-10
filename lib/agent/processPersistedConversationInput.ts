import { cancelAppointment } from "@/lib/appointments/cancelAppointment";
import { createAppointment } from "@/lib/appointments/createAppointment";
import { rescheduleAppointment } from "@/lib/appointments/rescheduleAppointment";
import { prisma } from "@/lib/db/prisma";
import { formatInTimeZone } from "date-fns-tz";

import { interpretPatientInput } from "./ai/interpretPatientInput";
import { validateInterpretedTime } from "./ai/validateInterpretedTime";
import { buildBookingOptions } from "./buildBookingOptions";
import {
  getMainMenuResponse,
} from "./conversation-state";
import { formatAppointmentDateTime } from "./formatAppointmentDateTime";
import { getUpcomingConversationAppointments } from "./getUpcomingConversationAppointments";
import { loadConversationContext } from "./loadConversationContext";
import { processConversationInput } from "./processConversationInput";
import { saveConversationContext } from "./saveConversationContext";
import type {
  AgentResponse,
  ConversationContext,
} from "./types/conversation";

const DEFAULT_TIMEZONE = "America/Mexico_City";

type ProcessPersistedConversationInput = {
  clinicId: string;
  conversationId: string;
  message: string;
};

function isBookingConfirmation({
  previousContext,
  response,
}: {
  previousContext: ConversationContext;
  response: AgentResponse | null;
}) {
  return (
    previousContext.state === "BOOK_CONFIRM" &&
    response?.text === "CONFIRMED"
  );
}

function isCancellationConfirmation({
  previousContext,
  response,
}: {
  previousContext: ConversationContext;
  response: AgentResponse | null;
}) {
  return (
    previousContext.state === "CANCEL_CONFIRM" &&
    response?.text === "CONFIRMED"
  );
}

function isRescheduleConfirmation({
  previousContext,
  response,
}: {
  previousContext: ConversationContext;
  response: AgentResponse | null;
}) {
  return (
    previousContext.state === "RESCHEDULE_CONFIRM" &&
    response?.text === "CONFIRMED"
  );
}

function getSelectedSlot(context: ConversationContext) {
  if (!context.lastOfferedSlotStartAt) {
    return null;
  }

  return (
    context.availableSlots?.find(
      (slot) =>
        slot.startAt === context.lastOfferedSlotStartAt,
    ) ?? null
  );
}

async function getClinicTimezone(clinicId: string) {
  const settings = await prisma.scheduleSettings.findUnique({
    where: {
      clinicId,
    },
    select: {
      timezone: true,
    },
  });

  return settings?.timezone ?? DEFAULT_TIMEZONE;
}

function formatUpcomingAppointment({
  startAt,
  timezone,
}: {
  startAt: Date;
  timezone: string;
}) {
  const localDate = formatInTimeZone(
    startAt,
    timezone,
    "yyyy-MM-dd",
  );

  const localTime = formatInTimeZone(
    startAt,
    timezone,
    "HH:mm",
  );

  return formatAppointmentDateTime({
    date: localDate,
    time: localTime,
    timezone,
  });
}

async function escalateConversationToHuman({
  clinicId,
  conversationId,
  context,
  reason,
  message,
}: {
  clinicId: string;
  conversationId: string;
  context: ConversationContext;
  reason: string;
  message: string;
}) {
  const nextContext: ConversationContext = {
    ...context,
    state: "WAITING_FOR_HUMAN",
  };

  await saveConversationContext({
    clinicId,
    conversationId,
    context: nextContext,
  });

  await prisma.whatsAppConversation.update({
    where: {
      id: conversationId,
    },
    data: {
      status: "ESCALATED",
      currentIntent: "REQUEST_DOCTOR",
      requiresHuman: true,
      escalationReason: reason,
    },
  });

  return {
    nextContext,
    response: {
      text: message,
      requiresHuman: true,
    } satisfies AgentResponse,
    handledDeterministically: false,
    requiresAiInterpretation: false,
  };
}

export async function processPersistedConversationInput({
  clinicId,
  conversationId,
  message,
}: ProcessPersistedConversationInput) {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!conversationId.trim()) {
    throw new Error("conversationId is required");
  }

  /*
   * Obtenemos el timezone real de la clínica una sola vez
   * por turno.
   */
  const timezone = await getClinicTimezone(clinicId);

  const storedContext = await loadConversationContext({
    clinicId,
    conversationId,
  });

  /*
   * El state machine permanece independiente de Prisma.
   * Solamente recibe el timezone ya resuelto dentro del
   * contexto de conversación.
   */
  const context: ConversationContext = {
    ...storedContext,
    timezone,
  };

  const result = processConversationInput({
    message,
    context,
  });

  /*
   * CONFIRMACIÓN FINAL DE AGENDADO
   */
  if (
    isBookingConfirmation({
      previousContext: context,
      response: result.response,
    })
  ) {
    const selectedSlot = getSelectedSlot(context);

    if (!selectedSlot) {
      const nextContext: ConversationContext = {
        state: "MAIN_MENU",
        timezone,
      };

      await saveConversationContext({
        clinicId,
        conversationId,
        context: nextContext,
      });

      return {
        ...result,
        nextContext,
        response: {
          text:
            "No pude recuperar el horario seleccionado. Por favor inicia nuevamente el proceso de agendado.",
        },
        requiresAiInterpretation: false,
      };
    }

    const conversation =
      await prisma.whatsAppConversation.findFirst({
        where: {
          id: conversationId,
          clinicId,
        },
        select: {
          id: true,
          phoneNumber: true,
          displayName: true,

          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
      });

    if (!conversation) {
      throw new Error("WhatsApp conversation not found");
    }

    const patientName = conversation.patient
      ? [
          conversation.patient.firstName,
          conversation.patient.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim()
      : conversation.displayName?.trim() || "";

    const patientPhone =
      conversation.patient?.phone?.trim() ||
      conversation.phoneNumber;

    const patientEmail =
      conversation.patient?.email?.trim() || null;

    if (!patientName) {
      return escalateConversationToHuman({
        clinicId,
        conversationId,
        context,
        reason:
          "No se pudo determinar el nombre del paciente al intentar crear la cita.",
        message:
          "Necesito ayuda de la clínica para completar tu cita. Ya les avisé para que puedan continuar contigo.",
      });
    }

    const startAt = new Date(selectedSlot.startAt);
    const endAt = new Date(selectedSlot.endAt);

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      throw new Error("Selected appointment slot is invalid");
    }

    const appointmentResult = await createAppointment({
      clinicId,

      patientId: conversation.patient?.id ?? null,

      patientName,
      patientPhone,
      patientEmail,

      startAt,
      endAt,

      timezone,

      appointmentType: null,
      title: null,
      notes: null,

      source: "WHATSAPP_AI",
    });

    if (!appointmentResult.success) {
      const nextContext: ConversationContext = {
        ...context,
        state: "BOOK_SELECT_DATE",
        requestedStartTime: undefined,
        lastOfferedSlotStartAt: undefined,
        availableSlots: undefined,
      };

      await saveConversationContext({
        clinicId,
        conversationId,
        context: nextContext,
      });

      return {
        ...result,
        nextContext,
        response: {
          text:
            "Ese horario ya no está disponible. ¿Qué otro día te gustaría intentar?",
          requiresAiInterpretation: true,
        },
        requiresAiInterpretation: true,
      };
    }

    const nextContext: ConversationContext = {
      state: "MAIN_MENU",
      timezone,
      appointmentId: appointmentResult.appointment.id,
    };

    await saveConversationContext({
      clinicId,
      conversationId,
      context: nextContext,
    });

    await prisma.whatsAppConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        appointmentId: appointmentResult.appointment.id,
        currentIntent: "BOOK_APPOINTMENT",
        status: "OPEN",
        requiresHuman: false,
        escalationReason: null,
      },
    });

    const formattedAppointmentDateTime =
      formatAppointmentDateTime({
        date: selectedSlot.localDate,
        time: selectedSlot.localStartTime,
        timezone,
      });

    return {
      ...result,
      nextContext,
      response: {
        text: `Tu cita quedó agendada para el ${formattedAppointmentDateTime}.`,
        options: [
          {
            id: "1",
            label: "Volver al menú",
          },
        ],
      },
      requiresAiInterpretation: false,
    };
  }

  /*
   * CONFIRMACIÓN FINAL DE CANCELACIÓN
   */
  if (
    isCancellationConfirmation({
      previousContext: context,
      response: result.response,
    })
  ) {
    if (!context.appointmentId) {
      const nextContext: ConversationContext = {
        state: "MAIN_MENU",
        timezone,
      };

      await saveConversationContext({
        clinicId,
        conversationId,
        context: nextContext,
      });

      return {
        ...result,
        nextContext,
        response: {
          ...getMainMenuResponse(),
          text:
            "No pude identificar la cita que querías cancelar.\n\n¿En qué más te puedo ayudar?",
        },
        requiresAiInterpretation: false,
      };
    }

    const cancellationResult = await cancelAppointment({
      clinicId,
      appointmentId: context.appointmentId,
      source: "WHATSAPP_AI",
      actorUserId: null,
      message:
        "La cita fue cancelada por el paciente mediante el agente de WhatsApp.",
    });

    if (!cancellationResult.success) {
      const nextContext: ConversationContext = {
        state: "MAIN_MENU",
        timezone,
      };

      await saveConversationContext({
        clinicId,
        conversationId,
        context: nextContext,
      });

      let failureMessage: string;

      switch (cancellationResult.reason) {
        case "ALREADY_CANCELLED":
          failureMessage =
            "Esta cita ya se encontraba cancelada.";
          break;

        case "COMPLETED":
          failureMessage =
            "Esta cita ya fue marcada como completada y no puede cancelarse.";
          break;

        case "NO_SHOW":
          failureMessage =
            "Esta cita ya fue marcada como inasistencia y no puede cancelarse.";
          break;

        case "NOT_FOUND":
        default:
          failureMessage =
            "No pude encontrar la cita que deseas cancelar.";
          break;
      }

      return {
        ...result,
        nextContext,
        response: {
          ...getMainMenuResponse(),
          text: `${failureMessage}\n\n¿En qué más te puedo ayudar?`,
        },
        requiresAiInterpretation: false,
      };
    }

    const formattedAppointmentDateTime =
      formatUpcomingAppointment({
        startAt: cancellationResult.appointment.startAt,
        timezone:
          cancellationResult.appointment.timezone ||
          timezone,
      });

    const nextContext: ConversationContext = {
      state: "MAIN_MENU",
      timezone,
    };

    await saveConversationContext({
      clinicId,
      conversationId,
      context: nextContext,
    });

    await prisma.whatsAppConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        appointmentId: null,
        currentIntent: "CANCEL_APPOINTMENT",
        status: "OPEN",
        requiresHuman: false,
        escalationReason: null,
      },
    });

    return {
      ...result,
      nextContext,
      response: {
        text: `Tu cita del ${formattedAppointmentDateTime} fue cancelada correctamente.\n\n¿En qué más te puedo ayudar?`,
        options: getMainMenuResponse().options,
      },
      handledDeterministically: true,
      requiresAiInterpretation: false,
    };
  }

  /*
   * CONFIRMACIÓN FINAL DE REAGENDADO
   *
   * El paciente ya seleccionó un nuevo slot y confirmó
   * explícitamente el cambio.
   */
  if (
    isRescheduleConfirmation({
      previousContext: context,
      response: result.response,
    })
  ) {
    if (!context.appointmentId) {
      const nextContext: ConversationContext = {
        state: "MAIN_MENU",
        timezone,
      };

      await saveConversationContext({
        clinicId,
        conversationId,
        context: nextContext,
      });

      return {
        ...result,
        nextContext,
        response: {
          ...getMainMenuResponse(),
          text:
            "No pude identificar la cita que querías cambiar.\n\n¿En qué más te puedo ayudar?",
        },
        requiresAiInterpretation: false,
      };
    }

    const selectedSlot = getSelectedSlot(context);

    if (!selectedSlot) {
      const nextContext: ConversationContext = {
        ...context,
        state: "RESCHEDULE_SELECT_DATE",
        requestedDate: undefined,
        requestedStartTime: undefined,
        lastOfferedSlotStartAt: undefined,
        availableSlots: undefined,
      };

      await saveConversationContext({
        clinicId,
        conversationId,
        context: nextContext,
      });

      return {
        ...result,
        nextContext,
        response: {
          text:
            "No pude recuperar el nuevo horario seleccionado. ¿Para qué día te gustaría cambiar tu cita?",
          requiresAiInterpretation: true,
        },
        requiresAiInterpretation: true,
      };
    }

    const startAt = new Date(selectedSlot.startAt);
    const endAt = new Date(selectedSlot.endAt);

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      throw new Error(
        "Selected reschedule slot is invalid",
      );
    }

    /*
     * Revalidamos el slot justo antes de modificar la cita.
     *
     * rescheduleAppointment() usa validateAppointmentSlot()
     * excluyendo la propia cita original.
     */
    const rescheduleResult =
      await rescheduleAppointment({
        clinicId,
        appointmentId: context.appointmentId,

        startAt,
        endAt,

        timezone,

        source: "WHATSAPP_AI",
        actorUserId: null,

        message:
          "La cita fue reagendada por el paciente mediante el agente de WhatsApp.",
      });

    if (!rescheduleResult.success) {
      const nextContext: ConversationContext = {
        ...context,
        state: "RESCHEDULE_SELECT_DATE",
        requestedDate: undefined,
        requestedStartTime: undefined,
        lastOfferedSlotStartAt: undefined,
        availableSlots: undefined,
      };

      await saveConversationContext({
        clinicId,
        conversationId,
        context: nextContext,
      });

      let failureMessage: string;

      switch (rescheduleResult.reason) {
        case "ALREADY_CANCELLED":
          failureMessage =
            "Esta cita ya se encontraba cancelada y no puede cambiarse.";
          break;

        case "COMPLETED":
          failureMessage =
            "Esta cita ya fue marcada como completada y no puede cambiarse.";
          break;

        case "NO_SHOW":
          failureMessage =
            "Esta cita ya fue marcada como inasistencia y no puede cambiarse.";
          break;

        case "OUTSIDE_WORKING_HOURS":
          failureMessage =
            "Ese horario ya no está disponible dentro del horario de la clínica.";
          break;

        case "OVERLAPS_APPOINTMENT":
          failureMessage =
            "Ese horario acaba de ser ocupado por otra cita.";
          break;

        case "OVERLAPS_SCHEDULE_BLOCK":
          failureMessage =
            "Ese horario ya no está disponible porque fue bloqueado por la clínica.";
          break;

        case "INVALID_INTERVAL":
          failureMessage =
            "El horario seleccionado ya no es válido.";
          break;

        case "NOT_FOUND":
        default:
          failureMessage =
            "No pude encontrar la cita que deseas cambiar.";
          break;
      }

      return {
        ...result,
        nextContext,
        response: {
          text: `${failureMessage} ¿Qué otro día te gustaría intentar?`,
          requiresAiInterpretation: true,
        },
        requiresAiInterpretation: true,
      };
    }

    const formattedAppointmentDateTime =
      formatUpcomingAppointment({
        startAt: rescheduleResult.appointment.startAt,
        timezone:
          rescheduleResult.appointment.timezone ||
          timezone,
      });

    const nextContext: ConversationContext = {
      state: "MAIN_MENU",
      timezone,
      appointmentId: rescheduleResult.appointment.id,
    };

    await saveConversationContext({
      clinicId,
      conversationId,
      context: nextContext,
    });

    await prisma.whatsAppConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        appointmentId: rescheduleResult.appointment.id,
        currentIntent: "RESCHEDULE_APPOINTMENT",
        status: "OPEN",
        requiresHuman: false,
        escalationReason: null,
      },
    });

    return {
      ...result,
      nextContext,
      response: {
        text: `Tu cita fue cambiada correctamente al ${formattedAppointmentDateTime}.\n\n¿En qué más te puedo ayudar?`,
        options: getMainMenuResponse().options,
      },
      handledDeterministically: true,
      requiresAiInterpretation: false,
    };
  }

  /*
   * BÚSQUEDA DE CITAS EXISTENTES
   */
  if (
    result.nextContext.state ===
    "MANAGE_FIND_APPOINTMENT"
  ) {
    const existingAppointments =
      result.nextContext.availableAppointments ?? [];

    if (existingAppointments.length === 0) {
      const appointments =
        await getUpcomingConversationAppointments({
          clinicId,
          conversationId,
        });

      if (appointments.length === 0) {
        const nextContext: ConversationContext = {
          state: "MAIN_MENU",
          timezone,
        };

        await saveConversationContext({
          clinicId,
          conversationId,
          context: nextContext,
        });

        return {
          nextContext,
          response: {
            text:
              "No encontré próximas citas asociadas a este número.\n\n¿En qué más te puedo ayudar?",
            options: [
              {
                id: "1",
                label: "Agendar una cita",
              },
              {
                id: "4",
                label: "Hablar con la clínica",
              },
            ],
          },
          handledDeterministically: true,
          requiresAiInterpretation: false,
        };
      }

      const availableAppointments =
        appointments.map((appointment) => ({
          id: appointment.id,
          startAt: appointment.startAt.toISOString(),
          endAt: appointment.endAt.toISOString(),
          timezone:
            appointment.timezone || timezone,
          status: appointment.status,
        }));

      if (availableAppointments.length === 1) {
        const appointmentContext: ConversationContext = {
          ...result.nextContext,
          timezone,
          availableAppointments,
        };

        const selectionResult =
          processConversationInput({
            message: "1",
            context: appointmentContext,
          });

        const nextContext: ConversationContext = {
          ...selectionResult.nextContext,
          timezone,
        };

        await saveConversationContext({
          clinicId,
          conversationId,
          context: nextContext,
        });

        return {
          ...selectionResult,
          nextContext,
        };
      }

      const nextContext: ConversationContext = {
        ...result.nextContext,
        timezone,
        availableAppointments,
      };

      await saveConversationContext({
        clinicId,
        conversationId,
        context: nextContext,
      });

      return {
        nextContext,
        response: {
          text:
            "Encontré varias próximas citas. ¿Cuál deseas consultar?",
          options: appointments.map(
            (appointment, index) => ({
              id: String(index + 1),
              label: formatUpcomingAppointment({
                startAt: appointment.startAt,
                timezone:
                  appointment.timezone || timezone,
              }),
            }),
          ),
        },
        handledDeterministically: true,
        requiresAiInterpretation: false,
      };
    }
  }

  /*
   * RESPUESTA DETERMINISTA
   *
   * Si el mensaje fue resuelto por opciones/reglas,
   * guardamos el contexto y terminamos aquí.
   */
  if (result.handledDeterministically) {
    await saveConversationContext({
      clinicId,
      conversationId,
      context: {
        ...result.nextContext,
        timezone,
      },
    });

    if (result.response?.requiresHuman) {
      await prisma.whatsAppConversation.update({
        where: {
          id: conversationId,
        },
        data: {
          status: "ESCALATED",
          currentIntent: "REQUEST_DOCTOR",
          requiresHuman: true,
          escalationReason:
            "El paciente solicitó hablar con la clínica.",
        },
      });
    }

    return {
      ...result,
      nextContext: {
        ...result.nextContext,
        timezone,
      },
    };
  }

  /*
   * INTERPRETACIÓN IA
   */
  const now = new Date();

  const currentDate = formatInTimeZone(
    now,
    timezone,
    "yyyy-MM-dd",
  );

  const currentTime = formatInTimeZone(
    now,
    timezone,
    "HH:mm",
  );

  const rawInterpretation = await interpretPatientInput({
    message,
    currentDate,
    currentTime,
    timezone,
    context,
  });

  const interpretation = validateInterpretedTime({
    message,
    interpretation: rawInterpretation,
  });

  /*
   * SOLICITUD DE HUMANO / CONTENIDO MÉDICO
   */
  if (interpretation.intent === "REQUEST_DOCTOR") {
    return escalateConversationToHuman({
      clinicId,
      conversationId,
      context,
      reason:
        interpretation.normalizedText ||
        "El paciente solicitó atención de la clínica.",
      message:
        "Voy a avisar a la clínica para que puedan continuar contigo.",
    });
  }

  /*
   * REAGENDAR CITA
   *
   * El estado conversacional tiene prioridad para saber
   * que estamos cambiando una cita existente.
   *
   * El modelo puede regresar:
   *
   * - RESCHEDULE_APPOINTMENT
   * - BOOK_APPOINTMENT
   *
   * para frases como "mañana por la tarde".
   */
  if (
    context.state === "RESCHEDULE_SELECT_DATE" &&
    (
      interpretation.intent ===
        "RESCHEDULE_APPOINTMENT" ||
      interpretation.intent === "BOOK_APPOINTMENT"
    )
  ) {
    const bookingResult = await buildBookingOptions({
      clinicId,
      interpretation,
      context,
      mode: "RESCHEDULE",
    });

    const nextContext: ConversationContext = {
      ...bookingResult.nextContext,
      timezone,

      /*
       * appointmentId debe sobrevivir durante todo
       * el flujo de reagendado.
       */
      appointmentId: context.appointmentId,
    };

    await saveConversationContext({
      clinicId,
      conversationId,
      context: nextContext,
    });

    await prisma.whatsAppConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        appointmentId:
          context.appointmentId ?? null,
        currentIntent:
          "RESCHEDULE_APPOINTMENT",
        status: "OPEN",
        requiresHuman: false,
        escalationReason: null,
      },
    });

    return {
      nextContext,
      response: bookingResult.response,
      handledDeterministically: false,
      requiresAiInterpretation: false,
    };
  }

  /*
   * AGENDAR CITA
   */
  if (interpretation.intent === "BOOK_APPOINTMENT") {
    const bookingResult = await buildBookingOptions({
      clinicId,
      interpretation,
      context,
      mode: "BOOK",
    });

    const nextContext: ConversationContext = {
      ...bookingResult.nextContext,
      timezone,
    };

    await saveConversationContext({
      clinicId,
      conversationId,
      context: nextContext,
    });

    await prisma.whatsAppConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        currentIntent: "BOOK_APPOINTMENT",
        status: "OPEN",
        requiresHuman: false,
        escalationReason: null,
      },
    });

    return {
      nextContext,
      response: bookingResult.response,
      handledDeterministically: false,
      requiresAiInterpretation: false,
    };
  }

  /*
   * Los demás intents se implementarán en sus respectivos
   * flujos.
   */
  await saveConversationContext({
    clinicId,
    conversationId,
    context,
  });

  return {
    nextContext: context,
    response: {
      text:
        "Por ahora puedo ayudarte a agendar una cita o comunicarte con la clínica.",
      options: [
        {
          id: "1",
          label: "Agendar una cita",
        },
        {
          id: "4",
          label: "Hablar con la clínica",
        },
      ],
    },
    handledDeterministically: false,
    requiresAiInterpretation: false,
  };
}