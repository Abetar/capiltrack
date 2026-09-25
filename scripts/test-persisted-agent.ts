import { prisma } from "../lib/db/prisma";
import { getOrCreateConversation } from "../lib/whatsapp/getOrCreateConversation";
import { processPersistedConversationInput } from "../lib/agent/processPersistedConversationInput";

async function main() {
  const clinic = await prisma.clinic.findFirst({
    select: {
      id: true,
      name: true,
    },
  });

  if (!clinic) {
    throw new Error("No existe ninguna clínica para ejecutar la prueba.");
  }

  console.log("\n=== CLINIC ===");
  console.dir(clinic);

  const phoneNumber = "+5213312345678";

  const conversation = await getOrCreateConversation({
    clinicId: clinic.id,
    phoneNumber,
    displayName: "Paciente prueba agente",
  });

  console.log("\n=== CONVERSATION BEFORE ===");
  console.dir(
    {
      id: conversation.id,
      phoneNumber: conversation.phoneNumber,
      context: conversation.context,
    },
    {
      depth: null,
    },
  );

  const result = await processPersistedConversationInput({
    clinicId: clinic.id,
    conversationId: conversation.id,
    message: "1",
  });

  console.log("\n=== PROCESS RESULT ===");
  console.dir(result, {
    depth: null,
  });

  const updatedConversation =
    await prisma.whatsAppConversation.findUnique({
      where: {
        id: conversation.id,
      },
      select: {
        id: true,
        phoneNumber: true,
        context: true,
      },
    });

  console.log("\n=== CONVERSATION AFTER ===");
  console.dir(updatedConversation, {
    depth: null,
  });
}

main()
  .catch((error) => {
    console.error("\nTEST_PERSISTED_AGENT_ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });