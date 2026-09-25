import { prisma } from "../lib/db/prisma";
import { cancelAppointment } from "../lib/appointments/cancelAppointment";

const CLINIC_ID = "cmmp6xnz30000akx1giilkyr5";

async function main() {
  const clinic = await prisma.clinic.findUnique({
    where: {
      id: CLINIC_ID,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!clinic) {
    throw new Error("No existe la clínica de prueba.");
  }

  const appointment = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,

      patientName: "Paciente prueba cancelación",
      patientPhone: "+5213312340000",

      startAt: new Date("2026-08-20T15:00:00.000Z"),
      endAt: new Date("2026-08-20T16:00:00.000Z"),

      timezone: "America/Mexico_City",

      status: "PENDING",
      source: "WHATSAPP_AI",
    },
  });

  try {
    console.log("\n=== BEFORE CANCELLATION ===");

    console.dir(appointment, {
      depth: null,
    });

    const result = await cancelAppointment({
      clinicId: clinic.id,
      appointmentId: appointment.id,
      source: "WHATSAPP_AI",
      actorUserId: null,
      message:
        "La cita fue cancelada por el paciente mediante el agente de WhatsApp.",
    });

    console.log("\n=== CANCEL RESULT ===");

    console.dir(result, {
      depth: null,
    });

    if (!result.success) {
      throw new Error(
        `La cancelación falló: ${result.reason}`,
      );
    }

    const updatedAppointment =
      await prisma.appointment.findUnique({
        where: {
          id: appointment.id,
        },
        select: {
          id: true,
          status: true,
          cancelledAt: true,
        },
      });

    console.log("\n=== APPOINTMENT AFTER ===");

    console.dir(updatedAppointment, {
      depth: null,
    });

    if (!updatedAppointment) {
      throw new Error(
        "No se encontró la cita después de cancelarla.",
      );
    }

    if (updatedAppointment.status !== "CANCELLED") {
      throw new Error(
        `Status inesperado: ${updatedAppointment.status}`,
      );
    }

    if (!updatedAppointment.cancelledAt) {
      throw new Error(
        "cancelledAt no fue establecido.",
      );
    }

    const events =
      await prisma.appointmentEvent.findMany({
        where: {
          appointmentId: appointment.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          type: true,
          source: true,
          actorUserId: true,
          message: true,
          metadata: true,
        },
      });

    console.log("\n=== APPOINTMENT EVENTS ===");

    console.dir(events, {
      depth: null,
    });

    if (events.length !== 1) {
      throw new Error(
        `Se esperaba 1 AppointmentEvent y se encontraron ${events.length}.`,
      );
    }

    const event = events[0];

    if (event.type !== "CANCELLED") {
      throw new Error(
        `Event type inesperado: ${event.type}`,
      );
    }

    if (event.source !== "WHATSAPP_AI") {
      throw new Error(
        `Event source inesperado: ${event.source}`,
      );
    }

    if (event.actorUserId !== null) {
      throw new Error(
        "actorUserId debería ser null para el agente.",
      );
    }

    console.log("\n=== TEST PASSED ===");

    console.log(
      "La cita fue cancelada y el AppointmentEvent se registró correctamente.",
    );
  } finally {
    await prisma.appointment.delete({
      where: {
        id: appointment.id,
      },
    });

    console.log("\n=== TEST APPOINTMENT DELETED ===");
    console.log(appointment.id);
  }
}

main()
  .catch((error) => {
    console.error("\nTEST_CANCEL_APPOINTMENT_ERROR");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });