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
    conversation,
    inboundMessage,
    agentResult,
  };
}