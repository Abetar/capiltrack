import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import DeleteProcedureButton from "@/components/procedures/DeleteProcedureButton";

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
    0
  );

  const totalImplantedUF = procedures.reduce(
    (acc, p) => acc + (p.implantedFollicularUnits ?? 0),
    0
  );

  const totalExtractedFollicles = procedures.reduce(
    (acc, p) => acc + (p.extractedFollicles ?? 0),
    0
  );

  const totalImplantedFollicles = procedures.reduce(
    (acc, p) => acc + (p.implantedFollicles ?? 0),
    0
  );

  const avgGrafts =
    totalProcedures > 0 ? Math.round(totalGrafts / totalProcedures) : 0;

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 30,
          gap: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Procedimientos
          </h1>

          <div
            style={{
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            {totalProcedures} procedimientos • {totalGrafts} grafts • promedio{" "}
            {avgGrafts}
          </div>
        </div>

        <Link href={`/patients/${id}/procedures/new`} style={primaryButton}>
          + Nuevo procedimiento
        </Link>
      </div>

      {/* RESUMEN */}
      <div style={summaryGrid}>
        <SummaryCard label="Grafts totales" value={totalGrafts} />
        <SummaryCard label="UF extraídas" value={totalExtractedUF} />
        <SummaryCard label="UF implantadas" value={totalImplantedUF} />
        <SummaryCard label="Folículos extraídos" value={totalExtractedFollicles} />
        <SummaryCard label="Folículos implantados" value={totalImplantedFollicles} />
      </div>

      {procedures.length === 0 && (
        <div style={emptyCard}>No hay procedimientos registrados</div>
      )}

      {procedures.map((p) => (
        <div key={p.id} style={procedureCard}>
          {/* HEADER CARD */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: "#111827" }}>
                {p.technique || "Procedimiento capilar"}
              </div>

              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                Fecha: {new Date(p.date).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Link
                href={`/patients/${id}/procedures/${p.id}/edit`}
                style={editLink}
              >
                Editar
              </Link>

              <DeleteProcedureButton procedureId={p.id} patientId={id} />
            </div>
          </div>

          {/* DATOS PRINCIPALES */}
          <div style={detailsGrid}>
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
            <InfoItem label="Zona receptora" value={p.recipientArea ?? "-"} />
          </div>

          {/* TIEMPOS */}
          {(p.extractionStart ||
            p.extractionEnd ||
            p.implantationStart ||
            p.implantationEnd) && (
            <div style={{ marginTop: 18 }}>
              <div style={sectionLabel}>Tiempos del procedimiento</div>

              <div style={detailsGrid}>
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

          {/* EQUIPO */}
          {(p.medicalTeam || p.nurses) && (
            <div style={{ marginTop: 18 }}>
              <div style={sectionLabel}>Equipo</div>

              <div style={detailsGrid}>
                <InfoItem label="Equipo médico" value={p.medicalTeam ?? "-"} />
                <InfoItem label="Enfermería" value={p.nurses ?? "-"} />
              </div>
            </div>
          )}

          {/* NOTAS */}
          {(p.notes || p.observations) && (
            <div style={{ marginTop: 18 }}>
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
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={summaryCard}>
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
        {value}
      </div>
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
    <div>
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "#111827", fontWeight: 500 }}>
        {value}
      </div>
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
};

const editLink: React.CSSProperties = {
  fontSize: 13,
  color: "#2563EB",
  textDecoration: "none",
  fontWeight: 600,
};

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 12,
  marginBottom: 24,
};

const summaryCard: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 16,
};

const emptyCard: React.CSSProperties = {
  background: "white",
  border: "1px dashed #D1D5DB",
  borderRadius: 12,
  padding: 24,
  color: "#6B7280",
  fontSize: 14,
};

const procedureCard: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 22,
  marginBottom: 16,
};

const detailsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 16,
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