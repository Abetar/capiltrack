import { prisma } from "@/lib/db/prisma";
import { normalizePhoneNumber } from "./normalizePhoneNumber";

type GetOrCreateConversationInput = {
  clinicId: string;
  phoneNumber: string;
  displayName?: string | null;
};

export async function getOrCreateConversation({
  clinicId,
  phoneNumber,
  displayName,
}: GetOrCreateConversationInput) {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!normalizedPhoneNumber) {
    throw new Error("phoneNumber is required");
  }

  const existingConversation =
    await prisma.whatsAppConversation.findFirst({
      where: {
        clinicId,
        phoneNumber: normalizedPhoneNumber,
        status: {
          not: "CLOSED",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (existingConversation) {
    if (
      displayName?.trim() &&
      displayName.trim() !== existingConversation.displayName
    ) {
      return prisma.whatsAppConversation.update({
        where: {
          id: existingConversation.id,
        },
        data: {
          displayName: displayName.trim(),
        },
      });
    }

    return existingConversation;
  }

  const patient = await prisma.patient.findFirst({
    where: {
      clinicId,
      phone: normalizedPhoneNumber,
    },
    select: {
      id: true,
    },
  });

  return prisma.whatsAppConversation.create({
    data: {
      clinicId,
      patientId: patient?.id ?? null,
      phoneNumber: normalizedPhoneNumber,
      displayName: displayName?.trim() || null,
      status: "OPEN",
      currentIntent: "NONE",
      requiresHuman: false,
    },
  });
}