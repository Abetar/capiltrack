import { prisma } from "@/lib/db/prisma";
import type { ConversationContext } from "./types/conversation";

type SaveConversationContextInput = {
  clinicId: string;
  conversationId: string;
  context: ConversationContext;
};

export async function saveConversationContext({
  clinicId,
  conversationId,
  context,
}: SaveConversationContextInput) {
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

  return prisma.whatsAppConversation.update({
    where: {
      id: conversationId,
    },
    data: {
      context: JSON.parse(
        JSON.stringify(context),
      ),
    },
  });
}