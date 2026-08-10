import { prisma } from "@/lib/db/prisma";

type SaveOutboundMessageInput = {
  clinicId: string;
  conversationId: string;

  sender?: "AI_AGENT" | "DOCTOR" | "SYSTEM";

  provider?: string | null;
  providerMessageId?: string | null;

  text?: string | null;

  contentType?:
    | "TEXT"
    | "IMAGE"
    | "AUDIO"
    | "VIDEO"
    | "DOCUMENT"
    | "LOCATION"
    | "INTERACTIVE"
    | "UNKNOWN";

  status?:
    | "PENDING"
    | "SENT"
    | "DELIVERED"
    | "READ"
    | "FAILED";

  rawPayload?: unknown;
  errorMessage?: string | null;

  sentAt?: Date | null;
};

export async function saveOutboundMessage({
  clinicId,
  conversationId,
  sender = "AI_AGENT",
  provider = null,
  providerMessageId = null,
  text = null,
  contentType = "TEXT",
  status = "PENDING",
  rawPayload,
  errorMessage = null,
  sentAt = null,
}: SaveOutboundMessageInput) {
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
        id: true,
      },
    });

  if (!conversation) {
    throw new Error("WhatsApp conversation not found");
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const message = await tx.whatsAppMessage.create({
      data: {
        clinicId,
        conversationId,

        provider,
        providerMessageId,

        direction: "OUTBOUND",
        sender,
        contentType,

        text: text?.trim() || null,

        status,

        rawPayload:
          rawPayload !== undefined
            ? JSON.parse(JSON.stringify(rawPayload))
            : undefined,

        errorMessage: errorMessage?.trim() || null,

        sentAt:
          sentAt ??
          (status === "SENT" ||
          status === "DELIVERED" ||
          status === "READ"
            ? now
            : null),

        deliveredAt:
          status === "DELIVERED" ||
          status === "READ"
            ? now
            : null,

        readAt: status === "READ" ? now : null,
      },
    });

    await tx.whatsAppConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessageAt: now,

        lastOutboundAt:
          status === "SENT" ||
          status === "DELIVERED" ||
          status === "READ"
            ? sentAt ?? now
            : undefined,
      },
    });

    return message;
  });
}