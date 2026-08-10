import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft, CalendarClock } from "lucide-react";
import AppointmentEventTimeline from "@/components/appointments/AppointmentEventTimeline";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import EditAppointmentForm from "./EditAppointmentForm";

const DEFAULT_TIMEZONE = "America/Mexico_City";

type EditAppointmentPageProps = {
  params: Promise<{
    appointmentId: string;
  }>;
};

export default async function EditAppointmentPage({
  params,
}: EditAppointmentPageProps) {
  const { user, reason } = await getCurrentUser();

  if (!user) {
    return <div>Acceso restringido: {reason}</div>;
  }

  const { appointmentId } = await params;

  const [appointment, settings, patients, appointmentEvents] =
    await Promise.all([
      prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          clinicId: user.clinicId,
          status: {
            not: "CANCELLED",
          },
        },
      }),

      prisma.scheduleSettings.findUnique({
        where: {
          clinicId: user.clinicId,
        },
      }),

      prisma.patient.findMany({
        where: {
          clinicId: user.clinicId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
        orderBy: [
          {
            firstName: "asc",
          },
          {
            lastName: "asc",
          },
        ],
      }),

      prisma.appointmentEvent.findMany({
        where: {
          appointmentId,
          clinicId: user.clinicId,
        },
        select: {
          id: true,
          type: true,
          source: true,
          message: true,
          createdAt: true,
          actorUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

  if (!appointment) {
    notFound();
  }

  const timezone =
    settings?.timezone ??
    appointment.timezone ??
    DEFAULT_TIMEZONE;

  const appointmentDate = formatInTimeZone(
    appointment.startAt,
    timezone,
    "yyyy-MM-dd",
  );

  const appointmentStartTime = formatInTimeZone(
    appointment.startAt,
    timezone,
    "HH:mm",
  );

  const appointmentMinutes = Math.round(
    (appointment.endAt.getTime() -
      appointment.startAt.getTime()) /
      60000,
  );

  const timelineEvents = appointmentEvents.map((event) => ({
    id: event.id,
    type: event.type,
    source: event.source,
    message: event.message,
    createdAtLabel: formatInTimeZone(
      event.createdAt,
      timezone,
      "dd/MM/yyyy · HH:mm",
    ),
    actorName:
      event.actorUser?.name ??
      event.actorUser?.email ??
      null,
  }));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Link
        href={`/agenda?date=${appointmentDate}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 20,
          color: "#6B7280",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={17} />
        Volver a Agenda
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 13,
          marginBottom: 26,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            background: "#EFF6FF",
            color: "#2563EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CalendarClock size={22} />
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Editar cita
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            Actualiza los datos, la fecha o el horario de la cita.
          </p>
        </div>
      </div>

      <EditAppointmentForm
        patients={patients}
        appointment={{
          id: appointment.id,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          patientPhone: appointment.patientPhone,
          patientEmail: appointment.patientEmail,
          date: appointmentDate,
          startTime: appointmentStartTime,
          appointmentMinutes,
          appointmentType: appointment.appointmentType,
          notes: appointment.notes,
        }}
      />

      <AppointmentEventTimeline events={timelineEvents} />
    </div>
  );
}