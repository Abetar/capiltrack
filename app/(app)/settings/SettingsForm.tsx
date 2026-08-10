"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ScheduleSettingsValue = {
  timezone: string;
  defaultAppointmentMinutes: number;
  minimumBookingNoticeHours: number;
  reminderHoursBefore: number;
};

type ScheduleAvailabilityValue = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type SettingsFormProps = {
  clinicName: string;
  clinicLogoUrl: string | null;
  doctorName: string | null;
  doctorLicense: string | null;
  doctorPhone: string | null;
  doctorSpecialty: string | null;
  doctorBranch: string | null;
  doctorUniversity: string | null;
  scheduleSettings: ScheduleSettingsValue;
  scheduleAvailabilities: ScheduleAvailabilityValue[];
};

type ScheduleDay = {
  dayOfWeek: number;
  label: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
};

const DAYS = [
  { dayOfWeek: 1, label: "Lunes" },
  { dayOfWeek: 2, label: "Martes" },
  { dayOfWeek: 3, label: "Miércoles" },
  { dayOfWeek: 4, label: "Jueves" },
  { dayOfWeek: 5, label: "Viernes" },
  { dayOfWeek: 6, label: "Sábado" },
  { dayOfWeek: 0, label: "Domingo" },
];

export default function SettingsForm({
  clinicName,
  clinicLogoUrl,
  doctorName,
  doctorLicense,
  doctorPhone,
  doctorSpecialty,
  doctorBranch,
  doctorUniversity,
  scheduleSettings,
  scheduleAvailabilities,
}: SettingsFormProps) {
  const router = useRouter();

  const initialScheduleDays = useMemo<ScheduleDay[]>(() => {
    return DAYS.map((day) => {
      const existingAvailability = scheduleAvailabilities.find(
        (availability) =>
          availability.dayOfWeek === day.dayOfWeek,
      );

      return {
        dayOfWeek: day.dayOfWeek,
        label: day.label,
        isActive: existingAvailability?.isActive ?? false,
        startTime: existingAvailability?.startTime ?? "09:00",
        endTime: existingAvailability?.endTime ?? "18:00",
      };
    });
  }, [scheduleAvailabilities]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    clinicLogoUrl,
  );
  const [scheduleDays, setScheduleDays] =
    useState<ScheduleDay[]>(initialScheduleDays);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPreviewUrl(clinicLogoUrl);
  }, [clinicLogoUrl]);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setPreviewUrl(clinicLogoUrl);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
  }

  function updateScheduleDay(
    dayOfWeek: number,
    field: "isActive" | "startTime" | "endTime",
    value: boolean | string,
  ) {
    setScheduleDays((currentDays) =>
      currentDays.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              [field]: value,
            }
          : day,
      ),
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    formData.set(
      "scheduleAvailabilities",
      JSON.stringify(
        scheduleDays.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          isActive: day.isActive,
          startTime: day.startTime,
          endTime: day.endTime,
        })),
      ),
    );

    const response = await fetch("/api/settings", {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);

      alert(
        data?.error || "No se pudo guardar la configuración",
      );
      return;
    }

    alert("Configuración guardada correctamente");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Section title="Datos de la clínica">
        <Field label="Nombre de la clínica">
          <input
            name="name"
            defaultValue={clinicName}
            style={inputStyle}
          />
        </Field>

        <Field label="Logo de la clínica">
          <label style={uploadWrapper}>
            <input
              type="file"
              name="logo"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Logo preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 70,
                  objectFit: "contain",
                }}
              />
            ) : (
              <div style={uploadContent}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Subir imagen
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#6B7280",
                    marginTop: 4,
                  }}
                >
                  PNG o JPG recomendado
                </div>
              </div>
            )}
          </label>
        </Field>
      </Section>

      <Section title="Datos del médico para recetas">
        <div style={gridStyle}>
          <Field label="Nombre del médico">
            <input
              name="doctorName"
              defaultValue={doctorName ?? ""}
              style={inputStyle}
              placeholder="Ej. Dr. Adrian Hernández López"
            />
          </Field>

          <Field label="Cédula profesional">
            <input
              name="doctorLicense"
              defaultValue={doctorLicense ?? ""}
              style={inputStyle}
              placeholder="Ej. 12963161"
            />
          </Field>

          <Field label="Especialidad">
            <input
              name="doctorSpecialty"
              defaultValue={doctorSpecialty ?? ""}
              style={inputStyle}
              placeholder="Ej. Medicina General"
            />
          </Field>

          <Field label="Área / ramo">
            <input
              name="doctorBranch"
              defaultValue={doctorBranch ?? ""}
              style={inputStyle}
              placeholder="Ej. Tricología y microinjerto capilar"
            />
          </Field>

          <Field label="Universidad">
            <input
              name="doctorUniversity"
              defaultValue={doctorUniversity ?? ""}
              style={inputStyle}
              placeholder="Ej. Universidad del Valle de Atemajac"
            />
          </Field>

          <Field label="Teléfono o contacto">
            <input
              name="doctorPhone"
              defaultValue={doctorPhone ?? ""}
              style={inputStyle}
              placeholder="Ej. 33 1234 5678"
            />
          </Field>
        </div>

        <p style={helperText}>
          Estos datos aparecerán automáticamente en las recetas
          médicas.
        </p>
      </Section>

      <Section title="Configuración de agenda">
        <div style={gridStyle}>
          <Field label="Zona horaria">
            <select
              name="timezone"
              defaultValue={scheduleSettings.timezone}
              style={inputStyle}
            >
              <option value="America/Mexico_City">
                Ciudad de México
              </option>
              <option value="America/Monterrey">
                Monterrey
              </option>
              <option value="America/Tijuana">
                Tijuana
              </option>
              <option value="America/Cancun">
                Cancún
              </option>
              <option value="America/Hermosillo">
                Hermosillo
              </option>
            </select>
          </Field>

          <Field label="Duración predeterminada de cita">
            <select
              name="defaultAppointmentMinutes"
              defaultValue={
                scheduleSettings.defaultAppointmentMinutes
              }
              style={inputStyle}
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos</option>
              <option value="90">90 minutos</option>
              <option value="120">120 minutos</option>
            </select>
          </Field>

          <Field label="Anticipación mínima para reservar">
            <input
              type="number"
              name="minimumBookingNoticeHours"
              min={0}
              max={720}
              defaultValue={
                scheduleSettings.minimumBookingNoticeHours
              }
              style={inputStyle}
            />
          </Field>

          <Field label="Enviar recordatorio horas antes">
            <input
              type="number"
              name="reminderHoursBefore"
              min={1}
              max={720}
              defaultValue={scheduleSettings.reminderHoursBefore}
              style={inputStyle}
            />
          </Field>
        </div>

        <p style={helperText}>
          La anticipación mínima evita que los pacientes agenden
          demasiado cerca de la hora actual. El recordatorio se usará
          posteriormente para las confirmaciones por WhatsApp.
        </p>
      </Section>

      <Section title="Horario semanal">
        <p style={scheduleDescription}>
          Activa los días laborales e indica el horario en el que el
          agente podrá ofrecer citas.
        </p>

        <div style={scheduleList}>
          {scheduleDays.map((day) => (
            <div key={day.dayOfWeek} style={scheduleRow}>
              <label style={scheduleDayControl}>
                <input
                  type="checkbox"
                  checked={day.isActive}
                  onChange={(event) =>
                    updateScheduleDay(
                      day.dayOfWeek,
                      "isActive",
                      event.target.checked,
                    )
                  }
                />

                <span style={scheduleDayLabel}>{day.label}</span>
              </label>

              <div style={scheduleTimeControls}>
                <input
                  type="time"
                  value={day.startTime}
                  disabled={!day.isActive}
                  onChange={(event) =>
                    updateScheduleDay(
                      day.dayOfWeek,
                      "startTime",
                      event.target.value,
                    )
                  }
                  style={{
                    ...timeInputStyle,
                    opacity: day.isActive ? 1 : 0.55,
                  }}
                />

                <span style={scheduleSeparator}>a</span>

                <input
                  type="time"
                  value={day.endTime}
                  disabled={!day.isActive}
                  onChange={(event) =>
                    updateScheduleDay(
                      day.dayOfWeek,
                      "endTime",
                      event.target.value,
                    )
                  }
                  style={{
                    ...timeInputStyle,
                    opacity: day.isActive ? 1 : 0.55,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </section>
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
    <div style={{ marginBottom: 24 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 22,
  marginBottom: 22,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#111827",
  marginBottom: 18,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "#6B7280",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 14,
  background: "white",
};

const uploadWrapper: React.CSSProperties = {
  width: "100%",
  height: 120,
  border: "2px dashed #D1D5DB",
  borderRadius: 10,
  cursor: "pointer",
  background: "#F9FAFB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const uploadContent: React.CSSProperties = {
  textAlign: "center",
};

const helperText: React.CSSProperties = {
  fontSize: 13,
  color: "#6B7280",
  marginTop: -4,
  lineHeight: 1.6,
};

const scheduleDescription: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: 13,
  color: "#6B7280",
  lineHeight: 1.6,
};

const scheduleList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const scheduleRow: React.CSSProperties = {
  minHeight: 58,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "12px 14px",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  background: "#F9FAFB",
  flexWrap: "wrap",
};

const scheduleDayControl: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
};

const scheduleDayLabel: React.CSSProperties = {
  minWidth: 90,
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
};

const scheduleTimeControls: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const timeInputStyle: React.CSSProperties = {
  padding: "9px 10px",
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  fontSize: 14,
  background: "white",
};

const scheduleSeparator: React.CSSProperties = {
  fontSize: 13,
  color: "#6B7280",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 4,
  background: "#2C6BED",
  color: "white",
  padding: "12px 18px",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};