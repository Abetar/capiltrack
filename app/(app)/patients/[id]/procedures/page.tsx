import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import DeleteProcedureButton from "@/components/procedures/DeleteProcedureButton";
import {
  HiCalendarDays,
  HiPencilSquare,
  HiPlus,
  HiScissors,
} from "react-icons/hi2";

export default async function PatientProceduresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user, reason } = await getCurrentUser();

  if (!user) {
    return <div>Acceso restringido: {reason}</div>;
  }

  const procedures = await prisma.transplantProcedure.findMany({
    where: {
      patientId: id,
      clinicId: user.clinicId,
    },
    orderBy: {
      date: "desc",
    },
  });

  const totalProcedures = procedures.length;

  const totalGrafts = procedures.reduce((acc, p) => acc + (p.grafts ?? 0), 0);

  const totalExtractedUF = procedures.reduce(
    (acc, p) => acc + (p.extractedFollicularUnits ?? 0),
    0,
  );

  const totalImplantedUF = procedures.reduce(
    (acc, p) => acc + (p.implantedFollicularUnits ?? 0),
    0,
  );

  const totalExtractedFollicles = procedures.reduce(
    (acc, p) => acc + (p.extractedFollicles ?? 0),
    0,
  );

  const totalImplantedFollicles = procedures.reduce(
    (acc, p) => acc + (p.implantedFollicles ?? 0),
    0,
  );

  const avgGrafts =
    totalProcedures > 0 ? Math.round(totalGrafts / totalProcedures) : 0;

  return (
    <div className="patient-procedures-page">
      <div className="patient-procedures-header">
        <div>
          <h1 className="patient-procedures-title">Procedimientos</h1>

          <div className="patient-procedures-subtitle">
            {totalProcedures} procedimientos • {totalGrafts} grafts • promedio{" "}
            {avgGrafts}
          </div>
        </div>

        <Link
          href={`/patients/${id}/procedures/new`}
          className="patient-procedures-new-button"
          style={primaryButton}
        >
          <HiPlus size={18} />
          <span>Nuevo procedimiento</span>
        </Link>
      </div>

      <div className="patient-procedures-summary-grid">
        <SummaryCard label="Grafts totales" value={totalGrafts} />
        <SummaryCard label="UF extraídas" value={totalExtractedUF} />
        <SummaryCard label="UF implantadas" value={totalImplantedUF} />
        <SummaryCard
          label="Folículos extraídos"
          value={totalExtractedFollicles}
        />
        <SummaryCard
          label="Folículos implantados"
          value={totalImplantedFollicles}
        />
      </div>

      {procedures.length === 0 && (
        <div style={emptyCard}>No hay procedimientos registrados</div>
      )}

      <div className="patient-procedures-list">
        {procedures.map((p) => (
          <div key={p.id} className="patient-procedure-card">
            <div className="patient-procedure-card-header">
              <div>
                <div className="patient-procedure-technique">
                  <HiScissors size={18} />
                  <span>{p.technique || "Procedimiento capilar"}</span>
                </div>

                <div className="patient-procedure-date">
                  <HiCalendarDays size={15} />
                  <span>Fecha: {new Date(p.date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="patient-procedure-actions">
                <Link
                  href={`/patients/${id}/procedures/${p.id}/edit`}
                  className="patient-procedure-edit-link"
                  style={editLink}
                >
                  <HiPencilSquare size={17} />
                  <span>Editar</span>
                </Link>

                <DeleteProcedureButton procedureId={p.id} patientId={id} />
              </div>
            </div>

            <div className="patient-procedure-details-grid">
              <InfoItem label="Grafts" value={p.grafts ?? "-"} />
              <InfoItem
                label="UF extraídas"
                value={p.extractedFollicularUnits ?? "-"}
              />
              <InfoItem
                label="UF implantadas"
                value={p.implantedFollicularUnits ?? "-"}
              />
              <InfoItem
                label="Folículos extraídos"
                value={p.extractedFollicles ?? "-"}
              />
              <InfoItem
                label="Folículos implantados"
                value={p.implantedFollicles ?? "-"}
              />
              <InfoItem label="Método" value={p.method ?? "-"} />
              <InfoItem label="Zona donante" value={p.donorArea ?? "-"} />
              <InfoItem
                label="Zona receptora"
                value={p.recipientArea ?? "-"}
              />
            </div>

            {(p.extractionStart ||
              p.extractionEnd ||
              p.implantationStart ||
              p.implantationEnd) && (
              <div className="patient-procedure-section">
                <div style={sectionLabel}>Tiempos del procedimiento</div>

                <div className="patient-procedure-details-grid">
                  <InfoItem
                    label="Inicio extracción"
                    value={formatTime(p.extractionStart)}
                  />
                  <InfoItem
                    label="Fin extracción"
                    value={formatTime(p.extractionEnd)}
                  />
                  <InfoItem
                    label="Inicio implantación"
                    value={formatTime(p.implantationStart)}
                  />
                  <InfoItem
                    label="Fin implantación"
                    value={formatTime(p.implantationEnd)}
                  />
                </div>
              </div>
            )}

            {(p.medicalTeam || p.nurses) && (
              <div className="patient-procedure-section">
                <div style={sectionLabel}>Equipo</div>

                <div className="patient-procedure-details-grid">
                  <InfoItem label="Equipo médico" value={p.medicalTeam ?? "-"} />
                  <InfoItem label="Enfermería" value={p.nurses ?? "-"} />
                </div>
              </div>
            )}

            {(p.notes || p.observations) && (
              <div className="patient-procedure-section">
                {p.notes && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={sectionLabel}>Notas</div>
                    <p style={paragraph}>{p.notes}</p>
                  </div>
                )}

                {p.observations && (
                  <div>
                    <div style={sectionLabel}>Observaciones</div>
                    <p style={paragraph}>{p.observations}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="patient-procedures-summary-card">
      <div className="patient-procedures-summary-label">{label}</div>
      <div className="patient-procedures-summary-value">{value}</div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="patient-procedure-info-item">
      <div className="patient-procedure-info-label">{label}</div>
      <div className="patient-procedure-info-value">{value}</div>
    </div>
  );
}

function formatTime(date: Date | null) {
  if (!date) return "-";

  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const primaryButton: React.CSSProperties = {
  background: "#2563EB",
  color: "white",
  padding: "10px 16px",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const editLink: React.CSSProperties = {
  fontSize: 13,
  color: "#2563EB",
  textDecoration: "none",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const emptyCard: React.CSSProperties = {
  background: "white",
  border: "1px dashed #D1D5DB",
  borderRadius: 12,
  padding: 24,
  color: "#6B7280",
  fontSize: 14,
};

const sectionLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 10,
};

const paragraph: React.CSSProperties = {
  fontSize: 14,
  color: "#374151",
  lineHeight: 1.6,
  margin: 0,
};