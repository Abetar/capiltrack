import { handleInboundMessage } from "./handleInboundMessage";
import { handleOutboundResponse } from "./handleOutboundResponse";

type HandleConversationTurnInput = {
  clinicId: string;

  phoneNumber: string;
  displayName?: string | null;

  text: string;

  provider?: string | null;
  providerMessageId?: string | null;

  rawPayload?: unknown;
};

export async function handleConversationTurn({
  clinicId,
  phoneNumber,
  displayName,
  text,
  provider = null,
  providerMessageId = null,
  rawPayload,
}: HandleConversationTurnInput) {
  const inboundResult = await handleInboundMessage({
    clinicId,
    phoneNumber,
    displayName,
    text,
    provider,
    providerMessageId,
    rawPayload,
  });

  const outboundResult = await handleOutboundResponse({
    clinicId,
    conversationId: inboundResult.conversation.id,
    response: inboundResult.agentResult.response,
    provider,
  });

  return {
    conversation: inboundResult.conversation,
    inboundMessage: inboundResult.inboundMessage,
    agentResult: inboundResult.agentResult,
    outboundMessage: outboundResult.message,
    outboundSkipped: outboundResult.skipped,
  };
}