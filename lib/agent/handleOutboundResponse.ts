import { saveOutboundMessage } from "@/lib/whatsapp/saveOutboundMessage";

import type { AgentResponse } from "./types/conversation";

type HandleOutboundResponseInput = {
  clinicId: string;
  conversationId: string;
  response: AgentResponse | null;
  provider?: string | null;
};

function formatAgentResponse(
  response: AgentResponse,
) {
  const text = response.text.trim();

  if (!response.options?.length) {
    return text;
  }

  const optionsText = response.options
    .map(
      (option) =>
        `${option.id}. ${option.label.trim()}`,
    )
    .join("\n");

  return `${text}\n\n${optionsText}`;
}

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

  const formattedText =
    formatAgentResponse(response);

  const message = await saveOutboundMessage({
    clinicId,
    conversationId,
    sender: "AI_AGENT",
    provider,
    text: formattedText,
    contentType: "TEXT",
    status: "PENDING",
  });

  return {
    message,
    skipped: false,
  };
}