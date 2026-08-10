import { saveOutboundMessage } from "@/lib/whatsapp/saveOutboundMessage";
import type { AgentResponse } from "./types/conversation";

type HandleOutboundResponseInput = {
  clinicId: string;
  conversationId: string;
  response: AgentResponse | null;

  provider?: string | null;
};

export async function handleOutboundResponse({
  clinicId,
  conversationId,
  response,
  provider = null,
}: HandleOutboundResponseInput) {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!conversationId.trim()) {
    throw new Error("conversationId is required");
  }

  if (!response?.text?.trim()) {
    return {
      message: null,
      skipped: true,
    };
  }

  const message = await saveOutboundMessage({
    clinicId,
    conversationId,
    sender: "AI_AGENT",
    provider,
    text: response.text,
    contentType: "TEXT",
    status: "PENDING",
  });

  return {
    message,
    skipped: false,
  };
}