import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { ConversationContext } from "../types/conversation";
import { resolveRelativeDate } from "./resolveRelativeDate";
import {
  AI_INTENTS,
  AI_TIME_PREFERENCES,
  type AiInterpretedInput,
} from "./types";

const interpretedInputSchema = z.object({
  intent: z.enum(AI_INTENTS),

  resolvedDate: z.string().nullable(),
  resolvedStartTime: z.string().nullable(),

  timePreference: z.enum(AI_TIME_PREFERENCES),

  afterTime: z.string().nullable(),
  beforeTime: z.string().nullable(),

  confidence: z.number().min(0).max(1),

  isAmbiguous: z.boolean(),
  ambiguityReason: z.string().nullable(),

  requiresConfirmation: z.boolean(),

  normalizedText: z.string(),
});

type InterpretPatientInputInput = {
  message: string;

  currentDate: string;
  currentTime: string;
  timezone: string;

  context: ConversationContext;
};

const MODEL = "gpt-5.4-nano";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey,
  });
}

function hasExplicitlyAmbiguousDateWording(message: string) {
  const normalizedMessage = message
    .trim()
    .toLocaleLowerCase("es-MX")
    .replace(/[¡!¿?,.]/g, " ")
    .replace(/\s+/g, " ");

  return (
    /\bque viene\b/.test(normalizedMessage) ||
    /\bproximo\b/.test(normalizedMessage) ||
    /\bpróximo\b/.test(normalizedMessage) ||
    /\bsiguiente\b/.test(normalizedMessage)
  );
}

function hasUnresolvedExactTime(
  interpretation: AiInterpretedInput,
) {
  return (
    interpretation.timePreference === "EXACT" &&
    !interpretation.resolvedStartTime
  );
}

function applyDeterministicDateResolution({
  message,
  currentDate,
  interpretation,
}: {
  message: string;
  currentDate: string;
  interpretation: AiInterpretedInput;
}): AiInterpretedInput {
  const deterministicDate = resolveRelativeDate({
    message,
    currentDate,
  });

  if (!deterministicDate) {
    return interpretation;
  }

  const dateWordingIsExplicitlyAmbiguous =
    hasExplicitlyAmbiguousDateWording(message);

  const exactTimeIsStillAmbiguous =
    hasUnresolvedExactTime(interpretation);

  const canResolveAmbiguity =
    !dateWordingIsExplicitlyAmbiguous &&
    !exactTimeIsStillAmbiguous;

  return {
    ...interpretation,
    resolvedDate: deterministicDate,

    isAmbiguous: canResolveAmbiguity
      ? false
      : interpretation.isAmbiguous,

    ambiguityReason: canResolveAmbiguity
      ? null
      : interpretation.ambiguityReason,

    confidence: canResolveAmbiguity
      ? Math.max(interpretation.confidence, 0.95)
      : interpretation.confidence,
  };
}

export async function interpretPatientInput({
  message,
  currentDate,
  currentTime,
  timezone,
  context,
}: InterpretPatientInputInput): Promise<AiInterpretedInput> {
  const normalizedMessage = message.trim();

  if (!normalizedMessage) {
    throw new Error("message is required");
  }

  if (!currentDate.trim()) {
    throw new Error("currentDate is required");
  }

  if (!currentTime.trim()) {
    throw new Error("currentTime is required");
  }

  if (!timezone.trim()) {
    throw new Error("timezone is required");
  }

  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.parse({
    model: MODEL,

    messages: [
      {
        role: "system",
        content: `
You interpret administrative WhatsApp messages for a medical clinic scheduling system.

Your ONLY job is to convert the patient's message into structured scheduling information.

You do NOT:
- create appointments
- cancel appointments
- reschedule appointments
- confirm appointments
- query availability
- invent available times
- provide medical advice
- diagnose
- answer medical questions

The CapilTrack backend performs all actions.

Current clinic date: ${currentDate}
Current clinic time: ${currentTime}
Clinic timezone: ${timezone}

Current conversation state: ${context.state}

Rules:

1. Resolve relative dates using the clinic's current date and timezone.

Examples:
- "mañana" means the calendar day after currentDate.
- "hoy" means currentDate.
- "el viernes" means the next upcoming Friday unless the wording clearly indicates otherwise.
- "la próxima semana" means the calendar week after the current one.

The CapilTrack backend also performs deterministic validation and resolution of simple relative dates after your interpretation.

2. resolvedDate:
- Use YYYY-MM-DD.
- Return null if no specific calendar date can be resolved safely.

3. resolvedStartTime, afterTime and beforeTime:
- Use HH:mm in 24-hour format.
- Never invent an exact time from vague expressions.
- "por la mañana" should use timePreference MORNING and resolvedStartTime null.
- "por la tarde" should use timePreference AFTERNOON and resolvedStartTime null.
- "por la noche" should use timePreference EVENING and resolvedStartTime null.
- "a las 4 de la tarde" may resolve to 16:00.
- "después de las 4" should use afterTime 16:00.
- "antes de las 2" should use beforeTime 14:00 when context makes PM clear; otherwise mark ambiguity.

4. Intent:

BOOK_APPOINTMENT:
Patient wants to schedule a new appointment.

RESCHEDULE_APPOINTMENT:
Patient wants to move or change an existing appointment.

CANCEL_APPOINTMENT:
Patient wants to cancel an existing appointment.

CONFIRM_ATTENDANCE:
Patient is confirming attendance for an existing appointment.

REQUEST_DOCTOR:
Patient explicitly asks to speak with the doctor, clinic staff or a human.

GENERAL_QUESTION:
Administrative question that does not clearly match another intent.

NONE:
No reliable intent can be determined.

5. Ambiguity:
Set isAmbiguous true whenever executing based solely on your interpretation could reasonably result in the wrong date, time or intent.

A missing preferred appointment time by itself is NOT necessarily ambiguity.
For example:
- "quiero cita el viernes" can resolve to the upcoming Friday and the backend can later offer available times.

Examples of real ambiguity:
- "el viernes que viene" can be ambiguous depending on regional usage.
- "a las 4" can be ambiguous if AM/PM cannot be inferred safely.
- "más tarde" without sufficient context can be ambiguous.

When ambiguous:
- explain the ambiguity briefly in ambiguityReason.
- prefer null over inventing values.

6. requiresConfirmation:
Set true for any operation that could create, reschedule, cancel or confirm an appointment.
The backend will always ask the patient for explicit confirmation before modifying the agenda.

7. normalizedText:
Return a short normalized Spanish interpretation of what the patient appears to mean.
Do not write a conversational response to the patient.

8. Medical content:
If the message asks for diagnosis, treatment recommendations, medication instructions, post-operative medical advice, or describes a medical concern requiring clinical judgment:
- intent must be REQUEST_DOCTOR.
- do not provide medical advice.
- set requiresConfirmation false.

9. Use the current conversation state as context, but never allow it to override clear patient wording.

10. If information is missing, return null fields. Never fabricate missing information.
        `.trim(),
      },

      {
        role: "user",
        content: normalizedMessage,
      },
    ],

    response_format: zodResponseFormat(
      interpretedInputSchema,
      "patient_input_interpretation",
    ),
  });

  const parsed = completion.choices[0]?.message.parsed;

  if (!parsed) {
    throw new Error(
      "OpenAI did not return a structured patient input interpretation",
    );
  }

  return applyDeterministicDateResolution({
    message: normalizedMessage,
    currentDate,
    interpretation: parsed,
  });
}