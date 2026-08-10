import { prisma } from "@/lib/db/prisma";

type SaveInboundMessageInput = {
  clinicId: string;
  conversationId: string;

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

  rawPayload?: unknown;
};

export async function saveInboundMessage({
  clinicId,
  conversationId,
  provider = null,
  providerMessageId = null,
  text = null,
  contentType = "TEXT",
  rawPayload,
}: SaveInboundMessageInput) {
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
        direction: "INBOUND",
        sender: "PATIENT",
        contentType,
        text: text?.trim() || null,
        status: "RECEIVED",
        rawPayload:
          rawPayload !== undefined
            ? JSON.parse(JSON.stringify(rawPayload))
            : undefined,
        receivedAt: now,
      },
    });

    await tx.whatsAppConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessageAt: now,
        lastInboundAt: now,
      },
    });

    return message;
  });
}