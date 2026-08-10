export const CONVERSATION_STATES = [
  "MAIN_MENU",

  "BOOK_SELECT_DATE",
  "BOOK_SELECT_TIME",
  "BOOK_CONFIRM",

  "MANAGE_FIND_APPOINTMENT",
  "MANAGE_MENU",

  "RESCHEDULE_SELECT_DATE",
  "RESCHEDULE_SELECT_TIME",
  "RESCHEDULE_CONFIRM",

  "CANCEL_CONFIRM",

  "WAITING_FOR_HUMAN",
] as const;

export type ConversationState = (typeof CONVERSATION_STATES)[number];

export type ConversationIntent =
  | "NONE"
  | "BOOK_APPOINTMENT"
  | "RESCHEDULE_APPOINTMENT"
  | "CANCEL_APPOINTMENT"
  | "CONFIRM_ATTENDANCE"
  | "REQUEST_DOCTOR"
  | "GENERAL_QUESTION";

export type ConversationContext = {
  state: ConversationState;

  timezone?: string;

  appointmentId?: string;

  availableAppointments?: Array<{
    id: string;
    startAt: string;
    endAt: string;
    timezone: string;
    status: string;
  }>;

  requestedDate?: string;
  requestedStartTime?: string;
  appointmentMinutes?: number;

  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;

  lastOfferedSlotStartAt?: string;

  availableSlots?: Array<{
    startAt: string;
    endAt: string;
    localDate: string;
    localStartTime: string;
    localEndTime: string;
  }>;
};

export type AgentResponse = {
  text: string;

  options?: Array<{
    id: string;
    label: string;
  }>;

  requiresAiInterpretation?: boolean;

  requiresHuman?: boolean;
};
