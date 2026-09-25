import { prisma } from "../lib/db/prisma";
import { handleInboundMessage } from "../lib/agent/handleInboundMessage";

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

  const phoneNumber = "+5213398765432";
  const providerMessageId = `test-${Date.now()}`;

  console.log("\n=== CLINIC ===");
  console.dir(clinic);

  const result = await handleInboundMessage({
    clinicId: clinic.id,
    phoneNumber,
    displayName: "Paciente inbound prueba",
    text: "1",
    provider: "TEST",
    providerMessageId,
    rawPayload: {
      test: true,
      providerMessageId,
    },
  });

  console.log("\n=== HANDLE INBOUND RESULT ===");

  /*
   * Si este providerMessageId ya fue procesado,
   * no existe un nuevo inbound ni un nuevo resultado
   * del agente para este intento.
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

      inboundMessage: {
        id: result.inboundMessage.id,
        direction: result.inboundMessage.direction,
        sender: result.inboundMessage.sender,
        status: result.inboundMessage.status,
        text: result.inboundMessage.text,
        provider: result.inboundMessage.provider,
        providerMessageId:
          result.inboundMessage.providerMessageId,
      },

      agentResult: result.agentResult,
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
    console.error("\nTEST_INBOUND_AGENT_ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });