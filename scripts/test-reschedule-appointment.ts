import { prisma } from "../lib/db/prisma";
import { rescheduleAppointment } from "../lib/appointments/rescheduleAppointment";

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

  /*
   * Cita original:
   * lunes 17 de agosto de 2026, 09:00 - 10:00 CDMX
   *
   * Nueva cita:
   * martes 18 de agosto de 2026, 11:00 - 12:00 CDMX
   */
  const originalStartAt = new Date(
    "2026-08-17T15:00:00.000Z",
  );

  const originalEndAt = new Date(
    "2026-08-17T16:00:00.000Z",
  );

  const newStartAt = new Date(
    "2026-08-18T17:00:00.000Z",
  );

  const newEndAt = new Date(
    "2026-08-18T18:00:00.000Z",
  );

  const appointment = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,

      patientName: "Paciente prueba reagendado",
      patientPhone: "+5213312340001",

      startAt: originalStartAt,
      endAt: originalEndAt,

      timezone: "America/Mexico_City",

      status: "CONFIRMED",
      source: "WHATSAPP_AI",
    },
  });

  try {
    console.log("\n=== BEFORE RESCHEDULE ===");

    console.dir(
      {
        clinic: clinic.name,
        appointmentId: appointment.id,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        timezone: appointment.timezone,
        status: appointment.status,
      },
      {
        depth: null,
      },
    );

    const result = await rescheduleAppointment({
      clinicId: clinic.id,
      appointmentId: appointment.id,

      startAt: newStartAt,
      endAt: newEndAt,

      timezone: "America/Mexico_City",

      source: "WHATSAPP_AI",
      actorUserId: null,

      message:
        "La cita fue reagendada por el paciente mediante el agente de WhatsApp.",
    });

    console.log("\n=== RESCHEDULE RESULT ===");

    console.dir(result, {
      depth: null,
    });

    if (!result.success) {
      throw new Error(
        `El reagendado falló: ${result.reason}`,
      );
    }

    const updatedAppointment =
      await prisma.appointment.findUnique({
        where: {
          id: appointment.id,
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          timezone: true,
          status: true,
        },
      });

    console.log("\n=== APPOINTMENT AFTER ===");

    console.dir(updatedAppointment, {
      depth: null,
    });

    if (!updatedAppointment) {
      throw new Error(
        "No se encontró la cita después de reagendarla.",
      );
    }

    if (
      updatedAppointment.startAt.getTime() !==
      newStartAt.getTime()
    ) {
      throw new Error(
        "startAt no fue actualizado correctamente.",
      );
    }

    if (
      updatedAppointment.endAt.getTime() !==
      newEndAt.getTime()
    ) {
      throw new Error(
        "endAt no fue actualizado correctamente.",
      );
    }

    if (
      updatedAppointment.timezone !==
      "America/Mexico_City"
    ) {
      throw new Error(
        `Timezone inesperado: ${updatedAppointment.timezone}`,
      );
    }

    /*
     * Reagendar no debe alterar el estado clínico
     * actual de la cita.
     */
    if (updatedAppointment.status !== "CONFIRMED") {
      throw new Error(
        `Status inesperado: ${updatedAppointment.status}`,
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

    if (event.type !== "RESCHEDULED") {
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

    const metadata = event.metadata;

    console.log("\n=== TEST PASSED ===");
    console.log(
      "La cita fue reagendada y el AppointmentEvent se registró correctamente.",
    );

    console.log("\n=== EXPECTED MOVE ===");
    console.dir(
      {
        from: {
          startAt: originalStartAt.toISOString(),
          endAt: originalEndAt.toISOString(),
        },
        to: {
          startAt: newStartAt.toISOString(),
          endAt: newEndAt.toISOString(),
        },
        metadata,
      },
      {
        depth: null,
      },
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
    console.error(
      "\nTEST_RESCHEDULE_APPOINTMENT_ERROR",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });