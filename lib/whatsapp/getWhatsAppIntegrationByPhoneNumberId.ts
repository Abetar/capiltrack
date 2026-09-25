import { prisma } from "@/lib/db/prisma";

export async function getWhatsAppIntegrationByPhoneNumberId(
  phoneNumberId: string,
) {
  if (!phoneNumberId.trim()) {
    throw new Error("phoneNumberId is required");
  }

  return prisma.whatsAppIntegration.findFirst({
    where: {
      phoneNumberId: phoneNumberId.trim(),
      isActive: true,
    },
    select: {
      id: true,
      clinicId: true,
      provider: true,
      phoneNumberId: true,
      businessAccountId: true,
      displayPhoneNumber: true,
    },
  });
}