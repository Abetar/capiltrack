"use server";

import { prisma } from "@/lib/db/prisma";

export async function deleteTreatment(treatmentId: string) {
  if (!treatmentId) {
    throw new Error("Treatment ID requerido");
  }

  await prisma.treatment.delete({
    where: {
      id: treatmentId,
    },
  });

  return { success: true };
}