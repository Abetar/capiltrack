import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft, CalendarX2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import NewScheduleBlockForm from "./NewScheduleBlockForm";

const DEFAULT_TIMEZONE = "America/Mexico_City";

type NewScheduleBlockPageProps = {
  searchParams: Promise<{
    date?: string;
  }>;
};

export default async function NewScheduleBlockPage({
  searchParams,
}: NewScheduleBlockPageProps) {
  const { user, reason } = await getCurrentUser();

  if (!user) {
    return <div>Acceso restringido: {reason}</div>;
  }

  const params = await searchParams;

  const settings = await prisma.scheduleSettings.findUnique({
    where: {
      clinicId: user.clinicId,
    },
    select: {
      timezone: true,
    },
  });

  const timezone =
    settings?.timezone ?? DEFAULT_TIMEZONE;

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
            background: "#F3F4F6",
            color: "#4B5563",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CalendarX2 size={22} />
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
            Bloquear horario
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            Reserva un periodo para cirugía, descanso, vacaciones u
            otra actividad.
          </p>
        </div>
      </div>

      <NewScheduleBlockForm initialDate={initialDate} />
    </div>
  );
}