"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Info,
  LoaderCircle,
  Save,
  UserRound,
} from "lucide-react";
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

type AvailableSlot = {
  startAt: string;
  endAt: string;
  localDate: string;
  localStartTime: string;
  localEndTime: string;
};

type AvailabilityStatus =
  | "AVAILABLE"
  | "TODAY_FINISHED"
  | "PAST_DATE"
  | "NON_WORKING_DAY"
  | "DAY_FULL"
  | "NO_CONTINUOUS_SPACE";

type AvailabilitySuggestion = {
  date: string;
  startTime: string | null;
  endTime: string | null;
  startAt: string | null;
  endAt: string | null;
};

type AvailabilityResponse = {
  date: string;
  timezone: string;
  appointmentMinutes: number;
  minimumBookingNoticeHours: number;

  status: AvailabilityStatus;
  explanation: string;

  availableSlots: AvailableSlot[];
  total: number;

  suggestion: AvailabilitySuggestion | null;
};

type NewAppointmentFormProps = {
  patients: PatientOption[];
  initialDate: string;
  defaultAppointmentMinutes: number;
};

type AutomaticDateAdjustment = {
  originalDate: string;
  selectedDate: string;
  explanation: string;
  suggestedStartTime: string | null;
  suggestedEndTime: string | null;
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

export default function NewAppointmentForm({
  patients,
  initialDate,
  defaultAppointmentMinutes,
}: NewAppointmentFormProps) {
  const router = useRouter();

  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");

  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState("");
  const [appointmentMinutes, setAppointmentMinutes] = useState(
    defaultAppointmentMinutes,
  );

  const [appointmentType, setAppointmentType] = useState("");
  const [notes, setNotes] = useState("");

  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [availabilityTimezone, setAvailabilityTimezone] =
    useState<string | null>(null);

  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus | null>(null);

  const [availabilityExplanation, setAvailabilityExplanation] =
    useState<string | null>(null);

  const [automaticDateAdjustment, setAutomaticDateAdjustment] =
    useState<AutomaticDateAdjustment | null>(null);

  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );

  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);

  const [dialog, setDialog] =
    useState<DialogState>(INITIAL_DIALOG_STATE);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === patientId),
    [patientId, patients],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadAvailability() {
      if (!date || !appointmentMinutes) {
        setAvailableSlots([]);
        setStartTime("");
        return;
      }

      setLoadingAvailability(true);
      setAvailabilityError(null);
      setAvailabilityExplanation(null);

      try {
        const searchParams = new URLSearchParams({
          date,
          appointmentMinutes: String(appointmentMinutes),
        });

        const response = await fetch(
          `/api/appointments/availability?${searchParams.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
          },
        );

        const data = (await response.json().catch(() => null)) as
          | AvailabilityResponse
          | { error?: string }
          | null;

        if (!response.ok) {
          setAvailableSlots([]);
          setStartTime("");
          setAvailabilityTimezone(null);
          setAvailabilityStatus(null);

          setAvailabilityError(
            data && "error" in data && data.error
              ? data.error
              : "No se pudo consultar la disponibilidad",
          );

          return;
        }

        if (
          !data ||
          !("availableSlots" in data) ||
          !("status" in data) ||
          !("explanation" in data)
        ) {
          setAvailableSlots([]);
          setStartTime("");
          setAvailabilityTimezone(null);
          setAvailabilityStatus(null);
          setAvailabilityError(
            "La respuesta de disponibilidad no es válida",
          );

          return;
        }

        setAvailabilityStatus(data.status);
        setAvailabilityExplanation(data.explanation);
        setAvailabilityTimezone(data.timezone);

        if (
          data.status !== "AVAILABLE" &&
          data.suggestion?.date &&
          data.suggestion.date !== date
        ) {
          setAvailableSlots([]);
          setStartTime("");

          setAutomaticDateAdjustment({
            originalDate: date,
            selectedDate: data.suggestion.date,
            explanation: data.explanation,
            suggestedStartTime: data.suggestion.startTime,
            suggestedEndTime: data.suggestion.endTime,
          });

          setDate(data.suggestion.date);
          return;
        }

        setAvailableSlots(data.availableSlots);

        setStartTime((currentStartTime) => {
          const stillAvailable = data.availableSlots.some(
            (slot) => slot.localStartTime === currentStartTime,
          );

          return stillAvailable ? currentStartTime : "";
        });
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("LOAD_APPOINTMENT_AVAILABILITY_ERROR", error);

        setAvailableSlots([]);
        setStartTime("");
        setAvailabilityTimezone(null);
        setAvailabilityStatus(null);
        setAvailabilityError(
          "No se pudo conectar con el servidor para consultar disponibilidad",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingAvailability(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      controller.abort();
    };
  }, [date, appointmentMinutes]);

  function handlePatientChange(value: string) {
    setPatientId(value);

    const patient = patients.find((item) => item.id === value);

    if (!patient) {
      return;
    }

    setPatientName(
      [patient.firstName, patient.lastName].filter(Boolean).join(" "),
    );

    setPatientPhone(patient.phone ?? "");
    setPatientEmail(patient.email ?? "");
  }

  function handleDateChange(nextDate: string) {
    setAutomaticDateAdjustment(null);
    setAvailabilityExplanation(null);
    setAvailabilityStatus(null);
    setStartTime("");
    setDate(nextDate);
  }

  function handleDurationChange(nextMinutes: number) {
    setAutomaticDateAdjustment(null);
    setAvailabilityExplanation(null);
    setAvailabilityStatus(null);
    setStartTime("");
    setAppointmentMinutes(nextMinutes);
  }

  function showErrorDialog(message: string) {
    setDialog({
      open: true,
      title: "No se pudo crear la cita",
      message,
      variant: "error",
      confirmLabel: "Entendido",
      redirectDate: null,
    });
  }

  function showWarningDialog(message: string) {
    setDialog({
      open: true,
      title: "Revisa la información",
      message,
      variant: "warning",
      confirmLabel: "Entendido",
      redirectDate: null,
    });
  }

  function showSuccessDialog() {
    setDialog({
      open: true,
      title: "Cita creada",
      message:
        `La cita de ${patientName} fue creada correctamente para el ` +
        `${formatDateLabel(date)} de ${formatTimeLabel(startTime)}.`,
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

    if (!startTime) {
      showWarningDialog(
        "Selecciona uno de los horarios disponibles antes de crear la cita.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
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
          appointmentType: appointmentType || null,
          notes: notes || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        showErrorDialog(
          data?.error ||
            "No fue posible crear la cita. Revisa la información e inténtalo nuevamente.",
        );
        return;
      }

      showSuccessDialog();
    } catch (error) {
      console.error("CREATE_APPOINTMENT_FORM_ERROR", error);

      showErrorDialog(
        "No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  const hasAvailableSlots = availableSlots.length > 0;

  return (
    <>
      <form onSubmit={handleSubmit} style={formStyle}>
        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div style={sectionIcon}>
              <UserRound size={20} />
            </div>

            <div>
              <h2 style={sectionTitle}>Paciente</h2>

              <p style={sectionSubtitle}>
                Selecciona un paciente existente o captura uno nuevo.
              </p>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Paciente existente</label>

            <select
              value={patientId}
              onChange={(event) =>
                handlePatientChange(event.target.value)
              }
              style={inputStyle}
            >
              <option value="">
                Paciente nuevo o sin expediente
              </option>

              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName ?? ""}
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
                  setPatientName(event.target.value)
                }
                style={inputStyle}
                placeholder="Ej. Juan Pérez"
              />
            </Field>

            <Field label="Teléfono">
              <input
                required
                value={patientPhone}
                onChange={(event) =>
                  setPatientPhone(event.target.value)
                }
                style={inputStyle}
                placeholder="Ej. 33 1234 5678"
              />
            </Field>

            <Field label="Correo electrónico">
              <input
                type="email"
                value={patientEmail}
                onChange={(event) =>
                  setPatientEmail(event.target.value)
                }
                style={inputStyle}
                placeholder="correo@ejemplo.com"
              />
            </Field>
          </div>

          {selectedPatient && (
            <p style={linkedPatientText}>
              La cita quedará vinculada al expediente de{" "}
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
              <h2 style={sectionTitle}>Fecha y horario</h2>

              <p style={sectionSubtitle}>
                CapilTrack muestra únicamente horarios realmente disponibles.
              </p>
            </div>
          </div>

          {automaticDateAdjustment && (
            <div style={automaticAdjustmentCard}>
              <div style={automaticAdjustmentIcon}>
                <Info size={18} />
              </div>

              <div>
                <strong style={automaticAdjustmentTitle}>
                  Se seleccionó el siguiente día disponible
                </strong>

                <p style={automaticAdjustmentText}>
                  {automaticDateAdjustment.explanation}
                </p>

                <p style={automaticAdjustmentSuggestion}>
                  La fecha cambió de{" "}
                  <strong>
                    {formatDateLabel(
                      automaticDateAdjustment.originalDate,
                    )}
                  </strong>{" "}
                  a{" "}
                  <strong>
                    {formatDateLabel(
                      automaticDateAdjustment.selectedDate,
                    )}
                  </strong>
                  .

                  {automaticDateAdjustment.suggestedStartTime &&
                    automaticDateAdjustment.suggestedEndTime && (
                      <>
                        {" "}
                        El primer horario disponible es de{" "}
                        <strong>
                          {formatTimeLabel(
                            automaticDateAdjustment.suggestedStartTime,
                          )}
                        </strong>{" "}
                        a{" "}
                        <strong>
                          {formatTimeLabel(
                            automaticDateAdjustment.suggestedEndTime,
                          )}
                        </strong>
                        .
                      </>
                    )}
                </p>
              </div>
            </div>
          )}

          <div style={gridStyle}>
            <Field label="Fecha">
              <input
                required
                type="date"
                value={date}
                onChange={(event) =>
                  handleDateChange(event.target.value)
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Duración">
              <select
                value={appointmentMinutes}
                onChange={(event) =>
                  handleDurationChange(
                    Number(event.target.value),
                  )
                }
                style={inputStyle}
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
                <option value={120}>120 minutos</option>
              </select>
            </Field>

            <Field label="Horario disponible">
              <select
                required
                value={startTime}
                disabled={
                  loadingAvailability ||
                  Boolean(availabilityError) ||
                  !hasAvailableSlots
                }
                onChange={(event) =>
                  setStartTime(event.target.value)
                }
                style={{
                  ...inputStyle,
                  opacity:
                    loadingAvailability || !hasAvailableSlots
                      ? 0.65
                      : 1,
                }}
              >
                <option value="">
                  {loadingAvailability
                    ? "Consultando horarios..."
                    : hasAvailableSlots
                      ? "Selecciona un horario"
                      : "No hay horarios disponibles"}
                </option>

                {availableSlots.map((slot) => (
                  <option
                    key={`${slot.startAt}-${slot.endAt}`}
                    value={slot.localStartTime}
                  >
                    {formatTimeLabel(slot.localStartTime)} a{" "}
                    {formatTimeLabel(slot.localEndTime)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {loadingAvailability && (
            <div style={availabilityLoading}>
              <LoaderCircle size={16} />
              Consultando disponibilidad...
            </div>
          )}

          {!loadingAvailability && availabilityError && (
            <p style={availabilityErrorStyle}>
              {availabilityError}
            </p>
          )}

          {!loadingAvailability &&
            !availabilityError &&
            availabilityStatus === "AVAILABLE" &&
            hasAvailableSlots && (
              <div style={availabilitySummary}>
                <Clock3 size={16} />

                <span>
                  {availabilityExplanation ??
                    `${availableSlots.length} horarios disponibles`}

                  {availabilityTimezone
                    ? ` · ${availabilityTimezone}`
                    : ""}
                </span>
              </div>
            )}

          {!loadingAvailability &&
            !availabilityError &&
            availabilityStatus !== "AVAILABLE" &&
            !automaticDateAdjustment &&
            availabilityExplanation && (
              <div style={noAvailabilityStyle}>
                <Info size={17} />

                <span>{availabilityExplanation}</span>
              </div>
            )}
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <div style={sectionIcon}>
              <Clock3 size={20} />
            </div>

            <div>
              <h2 style={sectionTitle}>Detalles de la cita</h2>

              <p style={sectionSubtitle}>
                Información operativa visible en la agenda.
              </p>
            </div>
          </div>

          <Field label="Tipo de cita">
            <input
              value={appointmentType}
              onChange={(event) =>
                setAppointmentType(event.target.value)
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
              placeholder="Indicaciones o información relevante para la cita"
            />
          </Field>
        </section>

        <div style={actionsStyle}>
          <Link
            href={`/agenda?date=${date}`}
            style={cancelButtonStyle}
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={
              loading ||
              loadingAvailability ||
              !startTime ||
              Boolean(availabilityError)
            }
            style={{
              ...submitButtonStyle,
              opacity:
                loading ||
                loadingAvailability ||
                !startTime ||
                Boolean(availabilityError)
                  ? 0.6
                  : 1,
              cursor:
                loading ||
                loadingAvailability ||
                !startTime ||
                Boolean(availabilityError)
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            <Save size={17} />

            {loading ? "Guardando..." : "Crear cita"}
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
  const parsedDate = new Date(`${value}T12:00:00`);

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
  const [hoursText, minutesText] = value.split(":");

  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return value;
  }

  const period = hours >= 12 ? "p. m." : "a. m.";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
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

const automaticAdjustmentCard: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 18,
  padding: 14,
  borderRadius: 10,
  border: "1px solid #BFDBFE",
  background: "#EFF6FF",
};

const automaticAdjustmentIcon: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  background: "white",
  color: "#2563EB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const automaticAdjustmentTitle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  color: "#1E3A8A",
};

const automaticAdjustmentText: React.CSSProperties = {
  margin: "5px 0 0",
  fontSize: 13,
  lineHeight: 1.5,
  color: "#1E40AF",
};

const automaticAdjustmentSuggestion: React.CSSProperties = {
  margin: "7px 0 0",
  fontSize: 13,
  lineHeight: 1.5,
  color: "#1E3A8A",
};

const availabilityLoading: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 2,
  fontSize: 13,
  color: "#6B7280",
};

const availabilityErrorStyle: React.CSSProperties = {
  margin: "2px 0 0",
  padding: 12,
  borderRadius: 9,
  border: "1px solid #FECACA",
  background: "#FEF2F2",
  color: "#B91C1C",
  fontSize: 13,
};

const noAvailabilityStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  margin: "2px 0 0",
  padding: 12,
  borderRadius: 9,
  border: "1px solid #FDE68A",
  background: "#FFFBEB",
  color: "#92400E",
  fontSize: 13,
  lineHeight: 1.5,
};

const availabilitySummary: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 2,
  padding: 12,
  borderRadius: 9,
  border: "1px solid #BBF7D0",
  background: "#F0FDF4",
  color: "#166534",
  fontSize: 13,
  fontWeight: 600,
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
  background: "#2563EB",
  color: "white",
  fontSize: 14,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};