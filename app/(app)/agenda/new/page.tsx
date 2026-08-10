import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import NewAppointmentForm from "./NewAppointmentForm";

const DEFAULT_TIMEZONE = "America/Mexico_City";

type NewAppointmentPageProps = {
  searchParams: Promise<{
    date?: string;
  }>;
};

export default async function NewAppointmentPage({
  searchParams,
}: NewAppointmentPageProps) {
  const { user, reason } = await getCurrentUser();

  if (!user) {
    return <div>Acceso restringido: {reason}</div>;
  }

  const params = await searchParams;

  const [settings, patients] = await Promise.all([
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
  ]);

  const timezone = settings?.timezone ?? DEFAULT_TIMEZONE;

  const today = formatInTimeZone(
    new Date(),
    timezone,
    "yyyy-MM-dd",
  );

  const initialDate =
    typeof params.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : today;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Link
        href={`/agenda?date=${initialDate}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 20,
          color: "#6B7280",
          fontSize: 14,
          fontWeight: 600,
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
          <CalendarPlus size={22} />
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
            Nueva cita
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            Registra una cita manual en la agenda de la clínica.
          </p>
        </div>
      </div>

      <NewAppointmentForm
        patients={patients}
        initialDate={initialDate}
        defaultAppointmentMinutes={
          settings?.defaultAppointmentMinutes ?? 60
        }
      />
    </div>
  );
}