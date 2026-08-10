"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarDays, Clock3, Save, UserRound } from "lucide-react";
import AppDialog, {
  type AppDialogVariant,
} from "@/components/ui/AppDialog";

type PatientOption = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
};

type AppointmentValue = {
  id: string;
  patientId: string | null;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  date: string;
  startTime: string;
  appointmentMinutes: number;
  appointmentType: string | null;
  notes: string | null;
};

type EditAppointmentFormProps = {
  appointment: AppointmentValue;
  patients: PatientOption[];
};

type DialogState = {
  open: boolean;
  title: string;
  message: string;
  variant: AppDialogVariant;
  confirmLabel: string;
  redirectDate: string | null;
};

const INITIAL_DIALOG_STATE: DialogState = {
  open: false,
  title: "",
  message: "",
  variant: "info",
  confirmLabel: "Aceptar",
  redirectDate: null,
};

export default function EditAppointmentForm({
  appointment,
  patients,
}: EditAppointmentFormProps) {
  const router = useRouter();

  const [patientId, setPatientId] = useState(
    appointment.patientId ?? "",
  );

  const [patientName, setPatientName] = useState(
    appointment.patientName,
  );

  const [patientPhone, setPatientPhone] = useState(
    appointment.patientPhone,
  );

  const [patientEmail, setPatientEmail] = useState(
    appointment.patientEmail ?? "",
  );

  const [date, setDate] = useState(appointment.date);

  const [startTime, setStartTime] = useState(
    appointment.startTime,
  );

  const [appointmentMinutes, setAppointmentMinutes] =
    useState(appointment.appointmentMinutes);

  const [appointmentType, setAppointmentType] = useState(
    appointment.appointmentType ?? "",
  );

  const [notes, setNotes] = useState(
    appointment.notes ?? "",
  );

  const [loading, setLoading] = useState(false);

  const [dialog, setDialog] =
    useState<DialogState>(INITIAL_DIALOG_STATE);

  const selectedPatient = useMemo(
    () =>
      patients.find(
        (patient) => patient.id === patientId,
      ),
    [patientId, patients],
  );

  function handlePatientChange(value: string) {
    setPatientId(value);

    const patient = patients.find(
      (item) => item.id === value,
    );

    if (!patient) {
      return;
    }

    setPatientName(
      [patient.firstName, patient.lastName]
        .filter(Boolean)
        .join(" "),
    );

    setPatientPhone(patient.phone ?? "");
    setPatientEmail(patient.email ?? "");
  }

  function showErrorDialog(message: string) {
    setDialog({
      open: true,
      title: "No se pudo actualizar la cita",
      message,
      variant: "error",
      confirmLabel: "Entendido",
      redirectDate: null,
    });
  }

  function showSuccessDialog() {
    setDialog({
      open: true,
      title: "Cita actualizada",
      message:
        `La cita de ${patientName} fue actualizada correctamente para el ` +
        `${formatDateLabel(date)} a las ${formatTimeLabel(startTime)}.`,
      variant: "success",
      confirmLabel: "Ver en Agenda",
      redirectDate: date,
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
        `/api/appointments/${appointment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId: patientId || null,
            patientName,
            patientPhone,
            patientEmail: patientEmail || null,
            date,
            startTime,
            appointmentMinutes,
            appointmentType:
              appointmentType || null,
            notes: notes || null,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        showErrorDialog(
          data?.error ||
            "No fue posible actualizar la cita. Revisa la información e inténtalo nuevamente.",
        );

        return;
      }

      showSuccessDialog();
    } catch (error) {
      console.error(
        "UPDATE_APPOINTMENT_FORM_ERROR",
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
      <form
        onSubmit={handleSubmit}
        style={formStyle}
      >
        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div style={sectionIcon}>
              <UserRound size={20} />
            </div>

            <div>
              <h2 style={sectionTitle}>
                Paciente
              </h2>

              <p style={sectionSubtitle}>
                Modifica el paciente vinculado o sus datos de contacto.
              </p>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Paciente existente
            </label>

            <select
              value={patientId}
              onChange={(event) =>
                handlePatientChange(
                  event.target.value,
                )
              }
              style={inputStyle}
            >
              <option value="">
                Paciente nuevo o sin expediente
              </option>

              {patients.map((patient) => (
                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.firstName}{" "}
                  {patient.lastName ?? ""}
                </option>
              ))}
            </select>
          </div>

          <div style={gridStyle}>
            <Field label="Nombre completo">
              <input
                required
                value={patientName}
                onChange={(event) =>
                  setPatientName(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Teléfono">
              <input
                required
                value={patientPhone}
                onChange={(event) =>
                  setPatientPhone(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Correo electrónico">
              <input
                type="email"
                value={patientEmail}
                onChange={(event) =>
                  setPatientEmail(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>
          </div>

          {selectedPatient && (
            <p style={linkedPatientText}>
              La cita está vinculada al expediente de{" "}
              <strong>
                {selectedPatient.firstName}{" "}
                {selectedPatient.lastName ?? ""}
              </strong>
              .
            </p>
          )}
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
                La nueva disponibilidad se validará antes de guardar.
              </p>
            </div>
          </div>

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
                  setStartTime(
                    event.target.value,
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Duración">
              <select
                value={appointmentMinutes}
                onChange={(event) =>
                  setAppointmentMinutes(
                    Number(event.target.value),
                  )
                }
                style={inputStyle}
              >
                <option value={15}>
                  15 minutos
                </option>

                <option value={30}>
                  30 minutos
                </option>

                <option value={45}>
                  45 minutos
                </option>

                <option value={60}>
                  60 minutos
                </option>

                <option value={90}>
                  90 minutos
                </option>

                <option value={120}>
                  120 minutos
                </option>
              </select>
            </Field>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div style={sectionIcon}>
              <Clock3 size={20} />
            </div>

            <div>
              <h2 style={sectionTitle}>
                Detalles de la cita
              </h2>

              <p style={sectionSubtitle}>
                Información operativa visible en la agenda.
              </p>
            </div>
          </div>

          <Field label="Tipo de cita">
            <input
              value={appointmentType}
              onChange={(event) =>
                setAppointmentType(
                  event.target.value,
                )
              }
              style={inputStyle}
              placeholder="Ej. Primera valoración, seguimiento, PRP"
            />
          </Field>

          <Field label="Notas">
            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              style={textareaStyle}
            />
          </Field>
        </section>

        <div style={actionsStyle}>
          <Link
            href={`/agenda?date=${appointment.date}`}
            style={cancelButtonStyle}
          >
            Cancelar cambios
          </Link>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitButtonStyle,
              opacity: loading ? 0.65 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            <Save size={17} />

            {loading
              ? "Guardando..."
              : "Guardar cambios"}
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

function formatDateLabel(value: string) {
  const parsedDate = new Date(
    `${value}T12:00:00`,
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function formatTimeLabel(value: string) {
  const [hoursText, minutesText] =
    value.split(":");

  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return value;
  }

  const period =
    hours >= 12 ? "p. m." : "a. m.";

  const displayHours =
    hours % 12 || 12;

  return `${displayHours}:${String(
    minutes,
  ).padStart(2, "0")} ${period}`;
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
      <label style={labelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
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
  background: "#EFF6FF",
  color: "#2563EB",
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

const linkedPatientText: React.CSSProperties = {
  margin: 0,
  padding: 12,
  borderRadius: 9,
  background: "#EFF6FF",
  color: "#1E40AF",
  fontSize: 13,
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
  textDecoration: "none",
};

const submitButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "10px 16px",
  border: "none",
  borderRadius: 9,
  background: "#2563EB",
  color: "white",
  fontSize: 14,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
};