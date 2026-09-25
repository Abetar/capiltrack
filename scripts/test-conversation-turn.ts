import { prisma } from "../lib/db/prisma";
import { handleConversationTurn } from "../lib/agent/handleConversationTurn";

async function main() {
  const clinic = await prisma.clinic.findFirst({
    select: {
      id: true,
      name: true,
    },
  });

  if (!clinic) {
    throw new Error(
      "No existe ninguna clínica para ejecutar la prueba.",
    );
  }

  const phoneNumber = "+5213311112233";
  const providerMessageId = `test-turn-${Date.now()}`;

  console.log("\n=== CLINIC ===");
  console.dir(clinic);

  const result = await handleConversationTurn({
    clinicId: clinic.id,
    phoneNumber,
    displayName: "Paciente prueba turno",
    text: "1",
    provider: "TEST",
    providerMessageId,
    rawPayload: {
      test: true,
      providerMessageId,
    },
  });

  console.log("\n=== TURN RESULT ===");

  /*
   * Un proveedor puede reenviar exactamente el mismo
   * mensaje. En ese caso el turno ya fue procesado y
   * no debemos esperar un nuevo inbound/outbound.
   */
  if (result.duplicate) {
    console.dir({
      duplicate: true,
      conversationId: result.conversationId,
    });

    return;
  }

  console.dir(
    {
      duplicate: false,
      conversationId: result.conversation.id,

      inboundMessage: result.inboundMessage
        ? {
            id: result.inboundMessage.id,
            direction: result.inboundMessage.direction,
            sender: result.inboundMessage.sender,
            status: result.inboundMessage.status,
            text: result.inboundMessage.text,
          }
        : null,

      agentResult: result.agentResult,

      outboundMessage: result.outboundMessage
        ? {
            id: result.outboundMessage.id,
            direction: result.outboundMessage.direction,
            sender: result.outboundMessage.sender,
            status: result.outboundMessage.status,
            text: result.outboundMessage.text,
          }
        : null,

      outboundSkipped: result.outboundSkipped,
    },
    {
      depth: null,
    },
  );

  const conversation =
    await prisma.whatsAppConversation.findUnique({
      where: {
        id: result.conversation.id,
      },
      select: {
        id: true,
        phoneNumber: true,
        context: true,

        lastMessageAt: true,
        lastInboundAt: true,
        lastOutboundAt: true,

        messages: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            direction: true,
            sender: true,
            status: true,
            text: true,
            provider: true,
            providerMessageId: true,
            receivedAt: true,
            sentAt: true,
          },
        },
      },
    });

  console.log("\n=== DATABASE AFTER ===");

  console.dir(conversation, {
    depth: null,
  });
}

main()
  .catch((error) => {
    console.error("\nTEST_CONVERSATION_TURN_ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });