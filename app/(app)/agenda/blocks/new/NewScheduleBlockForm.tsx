"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  LockKeyhole,
  Save,
} from "lucide-react";
import AppDialog, {
  type AppDialogVariant,
} from "@/components/ui/AppDialog";

type ScheduleBlockType = "HOURS" | "FULL_DAY" | "DATE_RANGE";

type NewScheduleBlockFormProps = {
  initialDate: string;
};

type DialogState = {
  open: boolean;
  title: string;
  message: string;
  variant: AppDialogVariant;
  confirmLabel: string;
  redirectDate: string | null;
};

const QUICK_REASONS = [
  "Vacaciones",
  "Cirugía",
  "Comida",
  "Congreso",
  "Ausencia",
];

const INITIAL_DIALOG_STATE: DialogState = {
  open: false,
  title: "",
  message: "",
  variant: "info",
  confirmLabel: "Aceptar",
  redirectDate: null,
};

export default function NewScheduleBlockForm({
  initialDate,
}: NewScheduleBlockFormProps) {
  const router = useRouter();

  const [blockType, setBlockType] =
    useState<ScheduleBlockType>("HOURS");

  const [title, setTitle] = useState("");

  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [fullDayDate, setFullDayDate] =
    useState(initialDate);

  const [startDate, setStartDate] =
    useState(initialDate);
  const [endDate, setEndDate] =
    useState(initialDate);

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [dialog, setDialog] =
    useState<DialogState>(INITIAL_DIALOG_STATE);

  function handleBlockTypeChange(
    nextBlockType: ScheduleBlockType,
  ) {
    setBlockType(nextBlockType);

    if (
      nextBlockType === "DATE_RANGE" &&
      !title.trim()
    ) {
      setTitle("Vacaciones");
    }
  }

  function getReturnDate() {
    if (blockType === "FULL_DAY") {
      return fullDayDate;
    }

    if (blockType === "DATE_RANGE") {
      return startDate;
    }

    return date;
  }

  function showErrorDialog(message: string) {
    setDialog({
      open: true,
      title: "No se pudo crear el bloqueo",
      message,
      variant: "error",
      confirmLabel: "Entendido",
      redirectDate: null,
    });
  }

  function showSuccessDialog(redirectDate: string) {
    setDialog({
      open: true,
      title: "Bloqueo creado",
      message:
        blockType === "DATE_RANGE"
          ? "El periodo quedó bloqueado correctamente y ya no será ofrecido para nuevas citas."
          : blockType === "FULL_DAY"
            ? "El día completo quedó bloqueado correctamente y ya no será ofrecido para nuevas citas."
            : "El horario quedó bloqueado correctamente y ya no será ofrecido para nuevas citas.",
      variant: "success",
      confirmLabel: "Ver en Agenda",
      redirectDate,
    });
  }

  function handleDialogConfirm() {
    const redirectDate = dialog.redirectDate;

    setDialog(INITIAL_DIALOG_STATE);

    if (!redirectDate) {
      return;
    }

    router.push(`/agenda?date=${redirectDate}`);
    router.refresh();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "/api/schedule-blocks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blockType,
            title,
            notes: notes || null,

            date,
            startTime,
            endTime,

            fullDayDate,

            startDate,
            endDate,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        showErrorDialog(
          data?.error ||
            "No fue posible crear el bloqueo. Revisa la información e inténtalo nuevamente.",
        );
        return;
      }

      showSuccessDialog(getReturnDate());
    } catch (error) {
      console.error(
        "CREATE_SCHEDULE_BLOCK_FORM_ERROR",
        error,
      );

      showErrorDialog(
        "No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={formStyle}>
        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div style={sectionIcon}>
              <LockKeyhole size={20} />
            </div>

            <div>
              <h2 style={sectionTitle}>
                Tipo de bloqueo
              </h2>

              <p style={sectionSubtitle}>
                Selecciona si necesitas bloquear unas
                horas, un día completo o varios días.
              </p>
            </div>
          </div>

          <div style={blockTypeGrid}>
            <BlockTypeButton
              active={blockType === "HOURS"}
              title="Algunas horas"
              description="Ej. comida, cirugía o cita personal."
              onClick={() =>
                handleBlockTypeChange("HOURS")
              }
            />

            <BlockTypeButton
              active={blockType === "FULL_DAY"}
              title="Día completo"
              description="El doctor no estará disponible durante todo el día."
              onClick={() =>
                handleBlockTypeChange("FULL_DAY")
              }
            />

            <BlockTypeButton
              active={blockType === "DATE_RANGE"}
              title="Varios días"
              description="Ej. vacaciones, congreso o ausencia prolongada."
              onClick={() =>
                handleBlockTypeChange("DATE_RANGE")
              }
            />
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div style={sectionIcon}>
              <LockKeyhole size={20} />
            </div>

            <div>
              <h2 style={sectionTitle}>
                Motivo del bloqueo
              </h2>

              <p style={sectionSubtitle}>
                Este periodo dejará de estar disponible
                para nuevas citas.
              </p>
            </div>
          </div>

          <div style={quickReasons}>
            {QUICK_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setTitle(reason)}
                style={{
                  ...quickReasonButton,
                  ...(title === reason
                    ? quickReasonButtonActive
                    : null),
                }}
              >
                {reason}
              </button>
            ))}
          </div>

          <Field label="Motivo">
            <input
              required
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              style={inputStyle}
              placeholder="Ej. Cirugía, comida, vacaciones o ausencia"
            />
          </Field>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div style={sectionIcon}>
              <CalendarDays size={20} />
            </div>

            <div>
              <h2 style={sectionTitle}>
                Fecha y horario
              </h2>

              <p style={sectionSubtitle}>
                No podrás crear un bloqueo encima de
                citas pendientes o confirmadas.
              </p>
            </div>
          </div>

          {blockType === "HOURS" && (
            <div style={gridStyle}>
              <Field label="Fecha">
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  style={inputStyle}
                />
              </Field>

              <Field label="Hora de inicio">
                <input
                  required
                  type="time"
                  value={startTime}
                  onChange={(event) =>
                    setStartTime(event.target.value)
                  }
                  style={inputStyle}
                />
              </Field>

              <Field label="Hora de finalización">
                <input
                  required
                  type="time"
                  value={endTime}
                  onChange={(event) =>
                    setEndTime(event.target.value)
                  }
                  style={inputStyle}
                />
              </Field>
            </div>
          )}

          {blockType === "FULL_DAY" && (
            <>
              <Field label="Día completo">
                <input
                  required
                  type="date"
                  value={fullDayDate}
                  onChange={(event) =>
                    setFullDayDate(event.target.value)
                  }
                  style={inputStyle}
                />
              </Field>

              <div style={informationCard}>
                Se bloquearán todos los horarios de ese
                día, desde las 12:00 a. m. hasta el inicio
                del día siguiente.
              </div>
            </>
          )}

          {blockType === "DATE_RANGE" && (
            <>
              <div style={gridStyle}>
                <Field label="Desde">
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      const nextStartDate =
                        event.target.value;

                      setStartDate(nextStartDate);

                      if (
                        endDate < nextStartDate
                      ) {
                        setEndDate(nextStartDate);
                      }
                    }}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Hasta">
                  <input
                    required
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(event.target.value)
                    }
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div style={informationCard}>
                Se bloquearán todos los horarios desde el{" "}
                <strong>
                  {formatDateLabel(startDate)}
                </strong>{" "}
                hasta el{" "}
                <strong>
                  {formatDateLabel(endDate)}
                </strong>
                , incluyendo ambos días.
              </div>
            </>
          )}
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div style={sectionIcon}>
              <Clock3 size={20} />
            </div>

            <div>
              <h2 style={sectionTitle}>Notas</h2>

              <p style={sectionSubtitle}>
                Información opcional visible dentro de la
                Agenda.
              </p>
            </div>
          </div>

          <Field label="Notas adicionales">
            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              style={textareaStyle}
              placeholder="Ej. Procedimiento fuera de la clínica"
            />
          </Field>
        </section>

        <div style={actionsStyle}>
          <Link
            href={`/agenda?date=${getReturnDate()}`}
            style={cancelButtonStyle}
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitButtonStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            <Save size={17} />

            {loading
              ? "Guardando..."
              : "Crear bloqueo"}
          </button>
        </div>
      </form>

      <AppDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        variant={dialog.variant}
        confirmLabel={dialog.confirmLabel}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
}

function BlockTypeButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...blockTypeButton,
        ...(active ? blockTypeButtonActive : null),
      }}
    >
      <span style={blockTypeTitle}>{title}</span>

      <span style={blockTypeDescription}>
        {description}
      </span>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function formatDateLabel(value: string) {
  if (!value) {
    return "fecha no seleccionada";
  }

  const parsedDate = new Date(
    `${value}T12:00:00`,
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const sectionStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 22,
};

const sectionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 22,
};

const sectionIcon: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: "#F3F4F6",
  color: "#4B5563",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 700,
  color: "#111827",
};

const sectionSubtitle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 13,
  color: "#6B7280",
};

const blockTypeGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 12,
};

const blockTypeButton: React.CSSProperties = {
  minHeight: 110,
  border: "1px solid #D1D5DB",
  borderRadius: 12,
  background: "white",
  padding: 16,
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  cursor: "pointer",
};

const blockTypeButtonActive: React.CSSProperties = {
  border: "2px solid #2563EB",
  background: "#EFF6FF",
};

const blockTypeTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const blockTypeDescription: React.CSSProperties = {
  fontSize: 12,
  color: "#6B7280",
  lineHeight: 1.5,
};

const quickReasons: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 18,
};

const quickReasonButton: React.CSSProperties = {
  minHeight: 34,
  padding: "7px 11px",
  borderRadius: 999,
  border: "1px solid #D1D5DB",
  background: "white",
  color: "#4B5563",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const quickReasonButtonActive: React.CSSProperties = {
  border: "1px solid #93C5FD",
  background: "#EFF6FF",
  color: "#1D4ED8",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const fieldStyle: React.CSSProperties = {
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 42,
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: 9,
  background: "white",
  color: "#111827",
  fontSize: 14,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: "vertical",
};

const informationCard: React.CSSProperties = {
  marginTop: 2,
  padding: 13,
  borderRadius: 9,
  border: "1px solid #BFDBFE",
  background: "#EFF6FF",
  color: "#1E40AF",
  fontSize: 13,
  lineHeight: 1.6,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 10,
};

const cancelButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "10px 16px",
  border: "1px solid #D1D5DB",
  borderRadius: 9,
  background: "white",
  color: "#374151",
  fontSize: 14,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const submitButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "10px 16px",
  border: "none",
  borderRadius: 9,
  background: "#4B5563",
  color: "white",
  fontSize: 14,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};