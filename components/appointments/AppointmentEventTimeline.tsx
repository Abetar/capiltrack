import type { CSSProperties } from "react";
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleX,
  Clock3,
  MessageCircle,
  RefreshCcw,
  UserRound,
} from "lucide-react";

type AppointmentEventItem = {
  id: string;
  type: string;
  source: string;
  message: string;
  createdAtLabel: string;
  actorName: string | null;
};

type AppointmentEventTimelineProps = {
  events: AppointmentEventItem[];
};

export default function AppointmentEventTimeline({
  events,
}: AppointmentEventTimelineProps) {
  return (
    <section style={sectionStyle}>
      <div style={sectionHeader}>
        <div style={sectionIcon}>
          <CalendarClock size={20} />
        </div>

        <div>
          <h2 style={sectionTitle}>Historial de la cita</h2>

          <p style={sectionSubtitle}>
            Registro cronológico de las acciones realizadas sobre esta cita.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={emptyState}>
          Todavía no hay eventos registrados para esta cita.
        </div>
      ) : (
        <div style={timelineStyle}>
          {events.map((event, index) => {
            const config = getEventConfig(event.type);

            return (
              <div key={event.id} style={eventRow}>
                <div style={timelineMarkerColumn}>
                  <div
                    style={{
                      ...eventIconStyle,
                      background: config.background,
                      color: config.color,
                    }}
                  >
                    {config.icon}
                  </div>

                  {index < events.length - 1 && (
                    <div style={timelineLine} />
                  )}
                </div>

                <div style={eventContent}>
                  <div style={eventHeader}>
                    <strong style={eventTitle}>
                      {config.label}
                    </strong>

                    <span style={eventDate}>
                      {event.createdAtLabel}
                    </span>
                  </div>

                  <p style={eventMessage}>{event.message}</p>

                  <div style={eventMeta}>
                    <span style={sourceBadge}>
                      {getSourceIcon(event.source)}
                      {getSourceLabel(event.source)}
                    </span>

                    {event.actorName && (
                      <span style={actorLabel}>
                        <UserRound size={13} />
                        {event.actorName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getEventConfig(type: string) {
  switch (type) {
    case "CREATED":
      return {
        label: "Cita creada",
        icon: <CalendarClock size={17} />,
        background: "#DBEAFE",
        color: "#1D4ED8",
      };

    case "CONFIRMED":
    case "PATIENT_CONFIRMED":
      return {
        label:
          type === "PATIENT_CONFIRMED"
            ? "Confirmada por el paciente"
            : "Cita confirmada",
        icon: <CheckCircle2 size={17} />,
        background: "#DCFCE7",
        color: "#15803D",
      };

    case "RESCHEDULED":
      return {
        label: "Cita reagendada",
        icon: <RefreshCcw size={17} />,
        background: "#EDE9FE",
        color: "#6D28D9",
      };

    case "CANCELLED":
      return {
        label: "Cita cancelada",
        icon: <CircleX size={17} />,
        background: "#FEE2E2",
        color: "#B91C1C",
      };

    case "COMPLETED":
      return {
        label: "Cita completada",
        icon: <CheckCircle2 size={17} />,
        background: "#DCFCE7",
        color: "#166534",
      };

    case "NO_SHOW":
      return {
        label: "Inasistencia",
        icon: <CircleX size={17} />,
        background: "#FEF3C7",
        color: "#B45309",
      };

    case "REMINDER_SENT":
      return {
        label: "Recordatorio enviado",
        icon: <MessageCircle size={17} />,
        background: "#E0F2FE",
        color: "#0369A1",
      };

    case "CONFIRMATION_REQUEST_SENT":
      return {
        label: "Confirmación solicitada",
        icon: <MessageCircle size={17} />,
        background: "#E0F2FE",
        color: "#0369A1",
      };

    case "PATIENT_REQUESTED_DOCTOR":
      return {
        label: "Solicitud para hablar con el doctor",
        icon: <UserRound size={17} />,
        background: "#FEF3C7",
        color: "#B45309",
      };

    default:
      return {
        label: "Actividad registrada",
        icon: <Clock3 size={17} />,
        background: "#F3F4F6",
        color: "#4B5563",
      };
  }
}

function getSourceLabel(source: string) {
  switch (source) {
    case "MANUAL":
      return "CapilTrack";

    case "WHATSAPP_AI":
      return "Agente de WhatsApp";

    case "SYSTEM":
      return "Sistema";

    case "PATIENT":
      return "Paciente";

    default:
      return source;
  }
}

function getSourceIcon(source: string) {
  if (source === "WHATSAPP_AI" || source === "SYSTEM") {
    return <Bot size={13} />;
  }

  if (source === "PATIENT") {
    return <MessageCircle size={13} />;
  }

  return <UserRound size={13} />;
}

const sectionStyle: CSSProperties = {
  marginTop: 18,
  padding: 22,
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  background: "white",
};

const sectionHeader: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 22,
};

const sectionIcon: CSSProperties = {
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

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 700,
  color: "#111827",
};

const sectionSubtitle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 13,
  color: "#6B7280",
  lineHeight: 1.5,
};

const emptyState: CSSProperties = {
  padding: 18,
  borderRadius: 10,
  background: "#F9FAFB",
  color: "#6B7280",
  fontSize: 13,
  textAlign: "center",
};

const timelineStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const eventRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  gap: 12,
};

const timelineMarkerColumn: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const eventIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const timelineLine: CSSProperties = {
  width: 2,
  flex: 1,
  minHeight: 28,
  margin: "5px 0",
  background: "#E5E7EB",
};

const eventContent: CSSProperties = {
  minWidth: 0,
  paddingBottom: 22,
};

const eventHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const eventTitle: CSSProperties = {
  fontSize: 14,
  color: "#111827",
};

const eventDate: CSSProperties = {
  fontSize: 12,
  color: "#9CA3AF",
};

const eventMessage: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 13,
  lineHeight: 1.55,
  color: "#4B5563",
};

const eventMeta: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 9,
};

const sourceBadge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 8px",
  borderRadius: 999,
  background: "#F3F4F6",
  color: "#4B5563",
  fontSize: 11,
  fontWeight: 700,
};

const actorLabel: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  color: "#6B7280",
};