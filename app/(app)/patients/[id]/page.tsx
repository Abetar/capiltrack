import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getPatientTimeline } from "@/lib/patient/getPatientTimeline";
import Link from "next/link";
import DeletePatientButton from "@/components/patients/DeletePatientButton";

import type {
  ConsultationFull,
  ProcedureFull,
} from "@/types/prisma";

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id,
      clinicId: user.clinicId,
    },
    include: {
      consultations: true,
      treatments: true,
      photos: true,
      transplants: true,
    },
  });

  if (!patient) {
    return <div>Paciente no encontrado</div>;
  }

  const events = await getPatientTimeline(patient.id, user.clinicId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
      {/* HEADER PACIENTE */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {patient.firstName} {patient.lastName ?? ""}
          </h1>
        </div>

        <DeletePatientButton patientId={patient.id} />
      </div>

      {/* GRID SUPERIOR */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <div style={cardStyle}>
          <h2 style={cardTitle}>Datos clínicos</h2>

          <InfoRow
            label="Fecha nacimiento"
            value={
              patient.birthDate
                ? patient.birthDate.toLocaleDateString()
                : "No registrado"
            }
          />

          <InfoRow label="Género" value={patient.gender || "No registrado"} />

          <InfoRow label="Notas" value={patient.notes || "Sin notas"} />
        </div>

        <div style={cardStyle}>
          <h2 style={cardTitle}>Actividad</h2>

          <ActivityRow label="Consultas" value={patient.consultations.length} />
          <ActivityRow label="Tratamientos" value={patient.treatments.length} />
          <ActivityRow label="Fotos" value={patient.photos.length} />
          <ActivityRow label="Transplantes" value={patient.transplants.length} />
        </div>
      </div>

      {/* TIMELINE */}

      <div style={cardStyle}>
        <h2 style={cardTitle}>Historia clínica</h2>

        <div style={{ marginTop: 30 }}>
          {events.map((event: (typeof events)[number]) => {
            if (event.type === "consultation") {
              return (
                <ConsultationEvent
                  key={event.id}
                  consultation={event.consultation}
                />
              );
            }

            if (event.type === "treatment") {
              return (
                <TreatmentEvent
                  key={event.id}
                  patientId={patient.id}
                  treatment={event.treatment}
                />
              );
            }

            if (event.type === "transplant") {
              return (
                <TransplantEvent
                  key={event.id}
                  patientId={patient.id}
                  procedure={event.transplant}
                />
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}

/* ========================= */
/* TIMELINE WRAPPER */
/* ========================= */

function TimelineWrapper({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        marginBottom: 30,
      }}
    >
      <div
        style={{
          width: 10,
          borderRadius: 6,
          background: color,
        }}
      />

      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

/* ========================= */
/* CONSULTATION EVENT */
/* ========================= */

function ConsultationEvent({
  consultation,
}: {
  consultation: ConsultationFull;
}) {
  const zoneLabels: Record<string, string> = {
    frontal: "Frontal",
    crown: "Coronilla",
    donor: "Zona donante",
    left: "Perfil izquierdo",
    right: "Perfil derecho",
    top: "Vista superior",
    macro: "Macro",
  };

  return (
    <TimelineWrapper color="#2563EB">
      <Link
        href={`/patients/${consultation.patientId}/consultations/${consultation.id}`}
        style={{ textDecoration: "none" }}
      >
        <div style={{ cursor: "pointer" }}>
          <div style={eventTitle}>
            Consulta — {new Date(consultation.date).toLocaleDateString()}
          </div>

          <div style={eventSubtitle}>
            {consultation.norwoodLevel
              ? `Norwood ${consultation.norwoodLevel}`
              : "Sin grado Norwood"}
          </div>
        </div>
      </Link>

      {consultation.photos.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={sectionLabel}>Fotos clínicas</div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {consultation.photos.map(
              (photo: (typeof consultation.photos)[number]) => (
                <div key={photo.id} style={photoCard}>
                  <img src={photo.url} style={photoStyle} />

                  {photo.zone && (
                    <div style={photoZone}>
                      {zoneLabels[photo.zone] || photo.zone}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {consultation.metrics.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={sectionLabel}>Métricas capilares</div>

          {consultation.metrics.map(
            (m: (typeof consultation.metrics)[number]) => (
              <div key={m.id} style={metricRow}>
                {m.zone ? zoneLabels[m.zone] || m.zone : "Zona"} —{" "}
                {m.density ?? "—"} grafts/cm²
              </div>
            )
          )}
        </div>
      )}
    </TimelineWrapper>
  );
}

/* ========================= */
/* TREATMENT EVENT */
/* ========================= */

function TreatmentEvent({
  treatment,
  patientId,
}: {
  treatment: {
    id: string;
    medication: string;
    startDate: Date | null;
  };
  patientId: string;
}) {
  return (
    <TimelineWrapper color="#059669">
      <Link
        href={`/patients/${patientId}/treatments`}
        style={{ textDecoration: "none" }}
      >
        <div style={{ cursor: "pointer" }}>
          <div style={eventTitle}>
            Tratamiento iniciado —{" "}
            {treatment.startDate
              ? new Date(treatment.startDate).toLocaleDateString()
              : "Sin fecha"}
          </div>

          <div style={eventSubtitle}>{treatment.medication}</div>
        </div>
      </Link>
    </TimelineWrapper>
  );
}

/* ========================= */
/* TRANSPLANT EVENT */
/* ========================= */

function TransplantEvent({
  procedure,
  patientId,
}: {
  procedure: ProcedureFull;
  patientId: string;
}) {
  return (
    <TimelineWrapper color="#9333EA">
      <Link
        href={`/patients/${patientId}/procedures`}
        style={{ textDecoration: "none" }}
      >
        <div style={{ cursor: "pointer" }}>
          <div style={eventTitle}>
            Procedimiento de injerto —{" "}
            {new Date(procedure.date).toLocaleDateString()}
          </div>

          <div style={eventSubtitle}>
            {procedure.grafts ? `${procedure.grafts} grafts` : ""}
          </div>
        </div>
      </Link>
    </TimelineWrapper>
  );
}

/* ========================= */
/* UI HELPERS */
/* ========================= */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: "#6B7280" }}>{label}</div>

      <div style={{ fontSize: 15, color: "#1F2937", fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

function ActivityRow({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <span style={{ color: "#374151", fontSize: 14 }}>{label}</span>

      <span style={{ fontWeight: 600, color: "#111827" }}>{value}</span>
    </div>
  );
}