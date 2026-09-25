import { prisma } from "@/lib/db/prisma";
import { getOrCreateConversation } from "@/lib/whatsapp/getOrCreateConversation";
import { saveInboundMessage } from "@/lib/whatsapp/saveInboundMessage";

import { processPersistedConversationInput } from "./processPersistedConversationInput";

type HandleInboundMessageInput = {
  clinicId: string;
  phoneNumber: string;
  displayName?: string | null;
  text: string;
  provider?: string | null;
  providerMessageId?: string | null;
  rawPayload?: unknown;
};

export async function handleInboundMessage({
  clinicId,
  phoneNumber,
  displayName,
  text,
  provider = null,
  providerMessageId = null,
  rawPayload,
}: HandleInboundMessageInput) {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!phoneNumber.trim()) {
    throw new Error("phoneNumber is required");
  }

  /*
   * Meta puede reenviar el mismo webhook.
   *
   * Si ya procesamos este providerMessageId,
   * no debemos guardar el mensaje ni ejecutar
   * nuevamente el agente.
   */
  if (providerMessageId?.trim()) {
    const existingMessage =
      await prisma.whatsAppMessage.findUnique({
        where: {
          providerMessageId: providerMessageId.trim(),
        },
        select: {
          id: true,
          conversationId: true,
        },
      });

    if (existingMessage) {
      return {
        duplicate: true as const,
        conversationId: existingMessage.conversationId,
      };
    }
  }

  const conversation = await getOrCreateConversation({
    clinicId,
    phoneNumber,
    displayName,
  });

  const inboundMessage = await saveInboundMessage({
    clinicId,
    conversationId: conversation.id,
    provider,
    providerMessageId,
    text,
    contentType: "TEXT",
    rawPayload,
  });

  const agentResult =
    await processPersistedConversationInput({
      clinicId,
      conversationId: conversation.id,
      message: text,
    });

  return {
    duplicate: false as const,
    conversation,
    inboundMessage,
    agentResult,
  };
}