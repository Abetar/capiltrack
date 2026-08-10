import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MessageCircle,
  Plus,
  UserRound,
} from "lucide-react";
import AppointmentActions from "@/components/appointments/AppointmentActions";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";

const DEFAULT_TIMEZONE = "America/Mexico_City";

type AgendaPageProps = {
  searchParams: Promise<{
    date?: string;
  }>;
};

type AgendaActivity =
  | {
      type: "appointment";
      id: string;
      startAt: Date;
      endAt: Date;
      patientName: string;
      appointmentType: string | null;
      title: string | null;
      status: string;
      source: string;
    }
  | {
      type: "block";
      id: string;
      startAt: Date;
      endAt: Date;
      title: string | null;
      notes: string | null;
    };

export default async function AgendaPage({
  searchParams,
}: AgendaPageProps) {
  const { user, reason } = await getCurrentUser();

  if (!user) {
    return (
      <div style={restrictedContainer}>
        <div style={restrictedCard}>
          <h2 style={restrictedTitle}>Acceso restringido</h2>

          <p style={restrictedText}>
            {reason === "no_subscription" &&
              "Tu suscripción ha expirado o no está activa."}

            {reason === "blocked" &&
              "Tu cuenta ha sido bloqueada. Contacta al administrador."}

            {reason === "not_authenticated" &&
              "Debes iniciar sesión para acceder."}

            {reason === "not_found" &&
              "No fue posible encontrar tu cuenta."}
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const clinicId = user.clinicId;

  const settings = await prisma.scheduleSettings.findUnique({
    where: {
      clinicId,
    },
  });

  const timezone = settings?.timezone ?? DEFAULT_TIMEZONE;

  const today = formatInTimeZone(
    new Date(),
    timezone,
    "yyyy-MM-dd",
  );

  const selectedDate = isValidDateString(params.date)
    ? params.date
    : today;

  const dayStart = fromZonedTime(
    `${selectedDate}T00:00:00`,
    timezone,
  );

  const dayEnd = addDays(dayStart, 1);

  const [appointments, scheduleBlocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        clinicId,
        startAt: {
          lt: dayEnd,
        },
        endAt: {
          gt: dayStart,
        },
        status: {
          not: "CANCELLED",
        },
      },
      orderBy: {
        startAt: "asc",
      },
    }),

    prisma.scheduleBlock.findMany({
      where: {
        clinicId,
        startAt: {
          lt: dayEnd,
        },
        endAt: {
          gt: dayStart,
        },
      },
      orderBy: {
        startAt: "asc",
      },
    }),
  ]);

  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === "CONFIRMED",
  ).length;

  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "PENDING",
  ).length;

  const activities: AgendaActivity[] = [
    ...appointments.map(
      (appointment): AgendaActivity => ({
        type: "appointment",
        id: appointment.id,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        patientName: appointment.patientName,
        appointmentType: appointment.appointmentType,
        title: appointment.title,
        status: appointment.status,
        source: appointment.source,
      }),
    ),

    ...scheduleBlocks.map(
      (block): AgendaActivity => ({
        type: "block",
        id: block.id,
        startAt: block.startAt,
        endAt: block.endAt,
        title: block.title,
        notes: block.notes,
      }),
    ),
  ].sort(
    (firstActivity, secondActivity) =>
      firstActivity.startAt.getTime() -
      secondActivity.startAt.getTime(),
  );

  const selectedCalendarDate = new Date(
    `${selectedDate}T12:00:00`,
  );

  const previousDate = format(
    addDays(selectedCalendarDate, -1),
    "yyyy-MM-dd",
  );

  const nextDate = format(
    addDays(selectedCalendarDate, 1),
    "yyyy-MM-dd",
  );

  const previousMonthDate = format(
    addMonths(selectedCalendarDate, -1),
    "yyyy-MM-dd",
  );

  const nextMonthDate = format(
    addMonths(selectedCalendarDate, 1),
    "yyyy-MM-dd",
  );

  const calendarDays = buildCalendarDays(
    selectedCalendarDate,
  );

  return (
    <div style={pageContainer}>
      <div style={pageHeader}>
        <div style={titleRow}>
          <div style={titleIcon}>
            <CalendarDays size={22} />
          </div>

          <div>
            <h1 style={pageTitle}>Agenda</h1>

            <p style={pageSubtitle}>
              Citas, confirmaciones y operación diaria de la clínica
            </p>
          </div>
        </div>

        <div style={headerActions}>
          <Link
            href={`/agenda/blocks/new?date=${selectedDate}`}
            style={secondaryActionButton}
          >
            <CalendarX2 size={18} />
            Bloquear horario
          </Link>

          <Link
            href={`/agenda/new?date=${selectedDate}`}
            style={primaryButton}
          >
            <Plus size={18} />
            Nueva cita
          </Link>
        </div>
      </div>

      <div style={statsGrid}>
        <SummaryCard
          label="Citas del día"
          value={appointments.length}
          icon={<CalendarDays size={20} />}
        />

        <SummaryCard
          label="Confirmadas"
          value={confirmedAppointments}
          icon={<CheckCircle2 size={20} />}
        />

        <SummaryCard
          label="Pendientes"
          value={pendingAppointments}
          icon={<Clock3 size={20} />}
        />

        <SummaryCard
          label="Bloqueos"
          value={scheduleBlocks.length}
          icon={<Clock3 size={20} />}
        />
      </div>

      <div style={navigationBar}>
        <div style={dateNavigation}>
          <Link
            href={`/agenda?date=${previousDate}`}
            style={navigationIconButton}
            aria-label="Día anterior"
          >
            <ChevronLeft size={18} />
          </Link>

          <Link
            href={`/agenda?date=${today}`}
            style={todayButton}
          >
            Hoy
          </Link>

          <Link
            href={`/agenda?date=${nextDate}`}
            style={navigationIconButton}
            aria-label="Día siguiente"
          >
            <ChevronRight size={18} />
          </Link>

          <div>
            <p style={navigationLabel}>
              Fecha seleccionada
            </p>

            <h2 style={navigationDate}>
              {formatInTimeZone(
                dayStart,
                timezone,
                "EEEE d 'de' MMMM 'de' yyyy",
                {
                  locale: es,
                },
              )}
            </h2>
          </div>
        </div>
      </div>

      <div style={agendaLayout}>
        <aside style={calendarCard}>
          <div style={calendarHeader}>
            <Link
              href={`/agenda?date=${previousMonthDate}`}
              style={calendarNavigationButton}
              aria-label="Mes anterior"
            >
              <ChevronLeft size={17} />
            </Link>

            <h2 style={calendarMonthTitle}>
              {format(
                selectedCalendarDate,
                "MMMM yyyy",
                {
                  locale: es,
                },
              )}
            </h2>

            <Link
              href={`/agenda?date=${nextMonthDate}`}
              style={calendarNavigationButton}
              aria-label="Mes siguiente"
            >
              <ChevronRight size={17} />
            </Link>
          </div>

          <div style={calendarWeekHeader}>
            {["L", "M", "M", "J", "V", "S", "D"].map(
              (dayLabel, index) => (
                <span
                  key={`${dayLabel}-${index}`}
                  style={calendarWeekDay}
                >
                  {dayLabel}
                </span>
              ),
            )}
          </div>

          <div style={calendarGrid}>
            {calendarDays.map((calendarDate) => {
              const dateValue = format(
                calendarDate,
                "yyyy-MM-dd",
              );

              const isSelected =
                dateValue === selectedDate;

              const isToday =
                dateValue === today;

              const belongsToCurrentMonth =
                isSameMonth(
                  calendarDate,
                  selectedCalendarDate,
                );

              return (
                <Link
                  key={dateValue}
                  href={`/agenda?date=${dateValue}`}
                  style={{
                    ...calendarDay,
                    ...(belongsToCurrentMonth
                      ? null
                      : calendarDayOutsideMonth),
                    ...(isToday
                      ? calendarDayToday
                      : null),
                    ...(isSelected
                      ? calendarDaySelected
                      : null),
                  }}
                >
                  {format(calendarDate, "d")}
                </Link>
              );
            })}
          </div>

          <div style={calendarFooter}>
            <div style={calendarLegend}>
              <span style={legendDotSelected} />
              Fecha seleccionada
            </div>

            <div style={calendarLegend}>
              <span style={legendDotToday} />
              Hoy
            </div>
          </div>
        </aside>

        <section style={agendaCard}>
          <div style={agendaHeader}>
            <div>
              <h2 style={sectionTitle}>
                Agenda del día
              </h2>

              <p style={sectionSubtitle}>
                Zona horaria: {timezone}
              </p>
            </div>

            <span style={activityCount}>
              {activities.length}{" "}
              {activities.length === 1
                ? "actividad"
                : "actividades"}
            </span>
          </div>

          {activities.length === 0 ? (
            <div style={emptyState}>
              <div style={emptyIcon}>
                <CalendarDays size={30} />
              </div>

              <h3 style={emptyTitle}>
                No hay actividad programada
              </h3>

              <p style={emptyText}>
                Las citas creadas manualmente o mediante
                WhatsApp aparecerán aquí.
              </p>
            </div>
          ) : (
            <div style={timeline}>
              {activities.map((activity) => {
                if (activity.type === "block") {
                  return (
                    <div
                      key={`block-${activity.id}`}
                      style={activityRow}
                    >
                      <TimeColumn
                        startAt={activity.startAt}
                        endAt={activity.endAt}
                        timezone={timezone}
                      />

                      <div style={blockCard}>
                        <div>
                          <div style={blockTitle}>
                            {activity.title ||
                              "Horario bloqueado"}
                          </div>

                          {activity.notes && (
                            <p style={blockNotes}>
                              {activity.notes}
                            </p>
                          )}
                        </div>

                        <span style={blockBadge}>
                          Bloqueo
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`appointment-${activity.id}`}
                    style={activityRow}
                  >
                    <TimeColumn
                      startAt={activity.startAt}
                      endAt={activity.endAt}
                      timezone={timezone}
                    />

                    <div style={appointmentCard}>
                      <div style={appointmentHeader}>
                        <div>
                          <div style={patientNameRow}>
                            <UserRound size={16} />

                            <span style={patientName}>
                              {activity.patientName}
                            </span>
                          </div>

                          <p style={appointmentType}>
                            {activity.appointmentType ||
                              activity.title ||
                              "Consulta clínica"}
                          </p>
                        </div>

                        <StatusBadge
                          status={activity.status}
                        />
                      </div>

                      <div style={appointmentMeta}>
                        <span style={metaItem}>
                          <Clock3 size={14} />

                          {formatInTimeZone(
                            activity.startAt,
                            timezone,
                            "HH:mm",
                          )}{" "}
                          –{" "}
                          {formatInTimeZone(
                            activity.endAt,
                            timezone,
                            "HH:mm",
                          )}
                        </span>

                        <span style={metaItem}>
                          <MessageCircle size={14} />

                          {activity.source ===
                          "WHATSAPP_AI"
                            ? "WhatsApp"
                            : "Manual"}
                        </span>
                      </div>

                      <AppointmentActions
                        appointmentId={activity.id}
                        patientName={
                          activity.patientName
                        }
                        status={activity.status}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function buildCalendarDays(selectedDate: Date) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const gridStart = startOfWeek(monthStart, {
    weekStartsOn: 1,
  });

  const gridEnd = endOfWeek(monthEnd, {
    weekStartsOn: 1,
  });

  const dates: Date[] = [];
  let currentDate = gridStart;

  while (currentDate <= gridEnd) {
    dates.push(currentDate);

    currentDate = addDays(
      currentDate,
      1,
    );
  }

  return dates;
}

function isValidDateString(
  value: string | undefined,
): value is string {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const parsedDate = new Date(
    `${value}T12:00:00`,
  );

  return !Number.isNaN(
    parsedDate.getTime(),
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div style={summaryCard}>
      <div style={summaryIcon}>
        {icon}
      </div>

      <div>
        <p style={summaryLabel}>
          {label}
        </p>

        <strong style={summaryValue}>
          {value}
        </strong>
      </div>
    </div>
  );
}

function TimeColumn({
  startAt,
  endAt,
  timezone,
}: {
  startAt: Date;
  endAt: Date;
  timezone: string;
}) {
  return (
    <div style={timeColumn}>
      <strong style={startTime}>
        {formatInTimeZone(
          startAt,
          timezone,
          "HH:mm",
        )}
      </strong>

      <span style={endTime}>
        {formatInTimeZone(
          endAt,
          timezone,
          "HH:mm",
        )}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    CSSProperties
  > = {
    PENDING: {
      background: "#FEF3C7",
      color: "#92400E",
    },

    CONFIRMED: {
      background: "#DCFCE7",
      color: "#166534",
    },

    COMPLETED: {
      background: "#DBEAFE",
      color: "#1D4ED8",
    },

    NO_SHOW: {
      background: "#FEE2E2",
      color: "#991B1B",
    },
  };

  const labels: Record<
    string,
    string
  > = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    COMPLETED: "Completada",
    NO_SHOW: "No asistió",
  };

  return (
    <span
      style={{
        ...statusBadge,
        ...(styles[status] ?? {
          background: "#F3F4F6",
          color: "#374151",
        }),
      }}
    >
      {labels[status] ?? status}
    </span>
  );
}

const pageContainer: CSSProperties = {
  maxWidth: 1320,
  margin: "0 auto",
};

const pageHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  flexWrap: "wrap",
  marginBottom: 28,
};

const titleRow: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
};

const titleIcon: CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 999,
  background: "#EFF6FF",
  color: "#2563EB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const pageTitle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
  color: "#111827",
};

const pageSubtitle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 14,
  color: "#6B7280",
};

const headerActions: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 10,
  flexWrap: "wrap",
};

const secondaryActionButton: CSSProperties = {
  minHeight: 42,
  border: "1px solid #D1D5DB",
  borderRadius: 10,
  background: "white",
  color: "#374151",
  padding: "10px 15px",
  fontSize: 14,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  textDecoration: "none",
};

const primaryButton: CSSProperties = {
  minHeight: 42,
  border: "none",
  borderRadius: 10,
  background: "#2563EB",
  color: "white",
  padding: "10px 16px",
  fontSize: 14,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  textDecoration: "none",
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const summaryCard: CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 18,
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const summaryIcon: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: "#EFF6FF",
  color: "#2563EB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const summaryLabel: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#6B7280",
};

const summaryValue: CSSProperties = {
  display: "block",
  marginTop: 3,
  fontSize: 24,
  color: "#111827",
};

const navigationBar: CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 16,
  marginBottom: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};

const dateNavigation: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  flexWrap: "wrap",
};

const navigationIconButton: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 9,
  border: "1px solid #D1D5DB",
  background: "white",
  color: "#374151",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const todayButton: CSSProperties = {
  minHeight: 38,
  padding: "0 13px",
  borderRadius: 9,
  border: "1px solid #BFDBFE",
  background: "#EFF6FF",
  color: "#1D4ED8",
  fontSize: 13,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const navigationLabel: CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: "#9CA3AF",
};

const navigationDate: CSSProperties = {
  margin: "3px 0 0",
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
  textTransform: "capitalize",
};

const viewButtons: CSSProperties = {
  display: "flex",
  gap: 6,
  background: "#F3F4F6",
  padding: 4,
  borderRadius: 10,
};

const activeViewButton: CSSProperties = {
  border: "none",
  borderRadius: 8,
  background: "white",
  color: "#1D4ED8",
  padding: "8px 13px",
  fontWeight: 700,
};

const inactiveViewButton: CSSProperties = {
  border: "none",
  borderRadius: 8,
  background: "transparent",
  color: "#9CA3AF",
  padding: "8px 13px",
  fontWeight: 600,
};

const agendaLayout: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "280px minmax(0, 1fr)",
  gap: 18,
  alignItems: "start",
};

const calendarCard: CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 18,
};

const calendarHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 18,
};

const calendarNavigationButton: CSSProperties = {
  width: 34,
  height: 34,
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  color: "#374151",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const calendarMonthTitle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
  textTransform: "capitalize",
};

const calendarWeekHeader: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(7, 1fr)",
  gap: 4,
  marginBottom: 7,
};

const calendarWeekDay: CSSProperties = {
  textAlign: "center",
  fontSize: 11,
  fontWeight: 700,
  color: "#9CA3AF",
};

const calendarGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(7, 1fr)",
  gap: 4,
};

const calendarDay: CSSProperties = {
  aspectRatio: "1 / 1",
  borderRadius: 8,
  color: "#374151",
  fontSize: 12,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const calendarDayOutsideMonth: CSSProperties = {
  color: "#D1D5DB",
};

const calendarDayToday: CSSProperties = {
  border: "1px solid #93C5FD",
  color: "#1D4ED8",
};

const calendarDaySelected: CSSProperties = {
  background: "#2563EB",
  color: "white",
  border: "1px solid #2563EB",
};

const calendarFooter: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  marginTop: 18,
  paddingTop: 14,
  borderTop: "1px solid #E5E7EB",
};

const calendarLegend: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 11,
  color: "#6B7280",
};

const legendDotSelected: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 999,
  background: "#2563EB",
};

const legendDotToday: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 999,
  border: "1px solid #60A5FA",
  background: "white",
};

const agendaCard: CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  overflow: "hidden",
};

const agendaHeader: CSSProperties = {
  padding: 20,
  borderBottom: "1px solid #E5E7EB",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
};

const sectionSubtitle: CSSProperties = {
  margin: "5px 0 0",
  fontSize: 13,
  color: "#6B7280",
};

const activityCount: CSSProperties = {
  background: "#F3F4F6",
  color: "#6B7280",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
};

const emptyState: CSSProperties = {
  minHeight: 390,
  padding: 30,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};

const emptyIcon: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 999,
  background: "#EFF6FF",
  color: "#2563EB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 16,
};

const emptyTitle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  color: "#111827",
};

const emptyText: CSSProperties = {
  maxWidth: 430,
  margin: "8px 0 0",
  fontSize: 14,
  lineHeight: 1.6,
  color: "#6B7280",
};

const timeline: CSSProperties = {
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const activityRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "70px minmax(0, 1fr)",
  gap: 14,
  alignItems: "stretch",
};

const timeColumn: CSSProperties = {
  paddingTop: 12,
  textAlign: "right",
};

const startTime: CSSProperties = {
  display: "block",
  fontSize: 14,
  color: "#111827",
};

const endTime: CSSProperties = {
  display: "block",
  marginTop: 3,
  fontSize: 12,
  color: "#9CA3AF",
};

const appointmentCard: CSSProperties = {
  border: "1px solid #BFDBFE",
  borderLeft: "4px solid #2563EB",
  borderRadius: 10,
  background: "#F8FAFF",
  padding: 16,
};

const appointmentHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const patientNameRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  color: "#111827",
};

const patientName: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
};

const appointmentType: CSSProperties = {
  margin: "5px 0 0",
  fontSize: 13,
  color: "#6B7280",
};

const appointmentMeta: CSSProperties = {
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
  marginTop: 13,
};

const metaItem: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12,
  color: "#6B7280",
};

const statusBadge: CSSProperties = {
  borderRadius: 999,
  padding: "5px 9px",
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const blockCard: CSSProperties = {
  border: "1px solid #D1D5DB",
  borderLeft: "4px solid #6B7280",
  borderRadius: 10,
  background: "#F9FAFB",
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const blockTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#374151",
};

const blockNotes: CSSProperties = {
  margin: "5px 0 0",
  fontSize: 13,
  color: "#6B7280",
};

const blockBadge: CSSProperties = {
  borderRadius: 999,
  padding: "5px 9px",
  background: "#E5E7EB",
  color: "#374151",
  fontSize: 11,
  fontWeight: 700,
};

const restrictedContainer: CSSProperties = {
  minHeight: "60vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const restrictedCard: CSSProperties = {
  maxWidth: 420,
  padding: 28,
  borderRadius: 12,
  border: "1px solid #E5E7EB",
  background: "white",
  textAlign: "center",
};

const restrictedTitle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  color: "#111827",
};

const restrictedText: CSSProperties = {
  margin: "10px 0 0",
  fontSize: 14,
  color: "#6B7280",
};