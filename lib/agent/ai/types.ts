export const AI_INTENTS = [
  "NONE",
  "BOOK_APPOINTMENT",
  "RESCHEDULE_APPOINTMENT",
  "CANCEL_APPOINTMENT",
  "CONFIRM_ATTENDANCE",
  "REQUEST_DOCTOR",
  "GENERAL_QUESTION",
] as const;

export type AiIntent =
  (typeof AI_INTENTS)[number];

export const AI_TIME_PREFERENCES = [
  "ANY",
  "MORNING",
  "AFTERNOON",
  "EVENING",
  "EXACT",
] as const;

export type AiTimePreference =
  (typeof AI_TIME_PREFERENCES)[number];

export type AiInterpretedInput = {
  intent: AiIntent;

  resolvedDate: string | null;
  resolvedStartTime: string | null;

  timePreference: AiTimePreference;

  afterTime: string | null;
  beforeTime: string | null;

  confidence: number;

  isAmbiguous: boolean;
  ambiguityReason: string | null;

  requiresConfirmation: boolean;

  normalizedText: string;
};