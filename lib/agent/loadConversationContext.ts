import { prisma } from "@/lib/db/prisma";
import {
  CONVERSATION_STATES,
  type ConversationContext,
  type ConversationState,
} from "./types/conversation";

type LoadConversationContextInput = {
  clinicId: string;
  conversationId: string;
};

function isConversationState(
  value: unknown,
): value is ConversationState {
  return (
    typeof value === "string" &&
    CONVERSATION_STATES.includes(
      value as ConversationState,
    )
  );
}

function parseConversationContext(
  value: unknown,
): ConversationContext {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {
      state: "MAIN_MENU",
    };
  }

  const rawContext = value as Record<string, unknown>;

  if (!isConversationState(rawContext.state)) {
    return {
      state: "MAIN_MENU",
    };
  }

  return value as ConversationContext;
}

export async function loadConversationContext({
  clinicId,
  conversationId,
}: LoadConversationContextInput): Promise<ConversationContext> {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!conversationId.trim()) {
    throw new Error("conversationId is required");
  }

  const conversation =
    await prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
        clinicId,
      },
      select: {
        context: true,
      },
    });

  if (!conversation) {
    throw new Error("WhatsApp conversation not found");
  }

  return parseConversationContext(
    conversation.context,
  );
}