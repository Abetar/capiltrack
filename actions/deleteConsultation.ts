"use server";

import { prisma } from "@/lib/db/prisma";

export async function deleteConsultation(consultationId: string) {
  if (!consultationId) {
    throw new Error("Consultation ID requerido");
  }

  await prisma.consultation.delete({
    where: {
      id: consultationId,
    },
  });

  return { success: true };
}