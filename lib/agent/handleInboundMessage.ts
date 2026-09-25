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
  console.log("[WA TRACE] handleInboundMessage START", {
    providerMessageId,
    text,
  });

  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!phoneNumber.trim()) {
    throw new Error("phoneNumber is required");
  }

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

    console.log("[WA TRACE] duplicate check", {
      providerMessageId,
      found: Boolean(existingMessage),
    });

    if (existingMessage) {
      console.log("[WA TRACE] DUPLICATE - returning early");

      return {
        duplicate: true as const,
        conversationId: existingMessage.conversationId,
      };
    }
  }

  console.log("[WA TRACE] getting conversation");

  const conversation = await getOrCreateConversation({
    clinicId,
    phoneNumber,
    displayName,
  });

  console.log("[WA TRACE] conversation ready", {
    conversationId: conversation.id,
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

  console.log("[WA TRACE] inbound SAVED", {
    inboundMessageId: inboundMessage.id,
  });

  console.log(
    "[WA TRACE] BEFORE processPersistedConversationInput",
  );

  const agentResult =
    await processPersistedConversationInput({
      clinicId,
      conversationId: conversation.id,
      message: text,
    });

  console.log(
    "[WA TRACE] AFTER processPersistedConversationInput",
    {
      response: agentResult.response?.text ?? null,
      state: agentResult.nextContext?.state ?? null,
    },
  );

  return {
    duplicate: false as const,
    conversation,
    inboundMessage,
    agentResult,
  };
}