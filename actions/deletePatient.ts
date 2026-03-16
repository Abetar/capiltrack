"use server";

import { prisma } from "@/lib/db/prisma";

export async function deletePatient(patientId: string) {
  if (!patientId) {
    throw new Error("Patient ID requerido");
  }

  await prisma.patient.delete({
    where: {
      id: patientId,
    },
  });

  return { success: true };
}