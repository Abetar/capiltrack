"use server";

import { prisma } from "@/lib/db/prisma";

export async function deleteProcedure(procedureId: string) {
  if (!procedureId) {
    throw new Error("Procedure ID requerido");
  }

  await prisma.transplantProcedure.delete({
    where: {
      id: procedureId,
    },
  });

  return { success: true };
}