import { prisma } from "@/lib/db/prisma";

type GetUpcomingConversationAppointmentsInput = {
  clinicId: string;
  conversationId: string;
  now?: Date;
  limit?: number;
};

export async function getUpcomingConversationAppointments({
  clinicId,
  conversationId,
  now = new Date(),
  limit = 5,
}: GetUpcomingConversationAppointmentsInput) {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!conversationId.trim()) {
    throw new Error("conversationId is required");
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("limit must be a positive integer");
  }

  const conversation =
    await prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
        clinicId,
      },
      select: {
        id: true,
        phoneNumber: true,
        patientId: true,
      },
    });

  if (!conversation) {
    throw new Error("WhatsApp conversation not found");
  }

  const patientId = conversation.patientId;
  const phoneNumber = conversation.phoneNumber.trim();

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,

      startAt: {
        gte: now,
      },

      status: {
        notIn: [
          "CANCELLED",
          "COMPLETED",
        ],
      },

      OR: [
        ...(patientId
          ? [
              {
                patientId,
              },
            ]
          : []),

        {
          patientPhone: phoneNumber,
        },
      ],
    },

    orderBy: {
      startAt: "asc",
    },

    take: limit,

    select: {
      id: true,

      patientId: true,
      patientName: true,
      patientPhone: true,

      title: true,
      appointmentType: true,

      startAt: true,
      endAt: true,
      timezone: true,

      status: true,
      source: true,

      notes: true,
    },
  });

  return appointments;
}