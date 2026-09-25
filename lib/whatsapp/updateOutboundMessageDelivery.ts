import { prisma } from "@/lib/db/prisma";

type MarkOutboundMessageSentInput = {
  clinicId: string;
  messageId: string;
  providerMessageId: string;
  rawPayload?: unknown;
};

type MarkOutboundMessageFailedInput = {
  clinicId: string;
  messageId: string;
  errorMessage: string;
  rawPayload?: unknown;
};

export async function markOutboundMessageSent({
  clinicId,
  messageId,
  providerMessageId,
  rawPayload,
}: MarkOutboundMessageSentInput) {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!messageId.trim()) {
    throw new Error("messageId is required");
  }

  if (!providerMessageId.trim()) {
    throw new Error("providerMessageId is required");
  }

  const message = await prisma.whatsAppMessage.findFirst({
    where: {
      id: messageId,
      clinicId,
      direction: "OUTBOUND",
    },
    select: {
      id: true,
      conversationId: true,
    },
  });

  if (!message) {
    throw new Error("Outbound WhatsApp message not found");
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const updatedMessage = await tx.whatsAppMessage.update({
      where: {
        id: message.id,
      },
      data: {
        providerMessageId: providerMessageId.trim(),
        status: "SENT",
        sentAt: now,
        errorMessage: null,
        rawPayload:
          rawPayload !== undefined
            ? JSON.parse(JSON.stringify(rawPayload))
            : undefined,
      },
    });

    await tx.whatsAppConversation.update({
      where: {
        id: message.conversationId,
      },
      data: {
        lastMessageAt: now,
        lastOutboundAt: now,
      },
    });

    return updatedMessage;
  });
}

export async function markOutboundMessageFailed({
  clinicId,
  messageId,
  errorMessage,
  rawPayload,
}: MarkOutboundMessageFailedInput) {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!messageId.trim()) {
    throw new Error("messageId is required");
  }

  const message = await prisma.whatsAppMessage.findFirst({
    where: {
      id: messageId,
      clinicId,
      direction: "OUTBOUND",
    },
    select: {
      id: true,
    },
  });

  if (!message) {
    throw new Error("Outbound WhatsApp message not found");
  }

  return prisma.whatsAppMessage.update({
    where: {
      id: message.id,
    },
    data: {
      status: "FAILED",
      errorMessage:
        errorMessage.trim() ||
        "Unknown WhatsApp delivery error",
      rawPayload:
        rawPayload !== undefined
          ? JSON.parse(JSON.stringify(rawPayload))
          : undefined,
    },
  });
}