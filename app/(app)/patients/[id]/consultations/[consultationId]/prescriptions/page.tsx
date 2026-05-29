import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";

export default async function PrescriptionsPage({
  params,
}: {
  params: Promise<{ id: string; consultationId: string }>;
}) {
  const { id, consultationId } = await params;

  const { user, reason } = await getCurrentUser();

  if (!user) {
    return <div>Acceso restringido: {reason}</div>;
  }

  const consultation = await prisma.consultation.findFirst({
    where: {
      id: consultationId,
      patientId: id,
      clinicId: user.clinicId,
    },
    include: {
      patient: true,
      prescriptions: {
        include: {
          items: {
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!consultation) {
    return <div>Consulta no encontrada</div>;
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <Link
            href={`/patients/${id}/consultations/${consultationId}`}
            style={backLink}
          >
            ← Volver a la consulta
          </Link>

          <h1 style={pageTitle}>Recetas médicas</h1>

          <p style={subtitle}>
            {consultation.patient.firstName} {consultation.patient.lastName ?? ""} ·{" "}
            Consulta del {new Date(consultation.date).toLocaleDateString()}
          </p>
        </div>

        <Link
          href={`/patients/${id}/consultations/${consultationId}/prescriptions/new`}
          style={primaryButton}
        >
          + Nueva receta
        </Link>
      </div>

      {/* EMPTY */}
      {consultation.prescriptions.length === 0 && (
        <div style={emptyCard}>
          <h2 style={emptyTitle}>No hay recetas registradas</h2>
          <p style={emptyText}>
            Crea una receta médica imprimible para este paciente y consérvala
            ligada a la consulta.
          </p>

          <Link
            href={`/patients/${id}/consultations/${consultationId}/prescriptions/new`}
            style={primaryButton}
          >
            Crear primera receta
          </Link>
        </div>
      )}

      {/* LIST */}
      <div style={listStyle}>
        {consultation.prescriptions.map((prescription) => (
          <div key={prescription.id} style={cardStyle}>
            <div style={cardHeader}>
              <div>
                <div style={cardTitle}>
                  Receta — {new Date(prescription.date).toLocaleDateString()}
                </div>

                <div style={cardMeta}>
                  {prescription.items.length} medicamento(s)
                </div>

                {prescription.diagnosis && (
                  <div style={diagnosisText}>
                    <strong>Diagnóstico:</strong> {prescription.diagnosis}
                  </div>
                )}
              </div>

              <div style={actionsStyle}>
                <Link
                  href={`/patients/${id}/consultations/${consultationId}/prescriptions/${prescription.id}/edit`}
                  style={secondaryButton}
                >
                  Editar
                </Link>

                <a
                  href={`/api/patients/${id}/consultations/${consultationId}/prescriptions/${prescription.id}/pdf`}
                  target="_blank"
                  style={darkButton}
                >
                  Imprimir PDF
                </a>
              </div>
            </div>

            {prescription.items.length > 0 && (
              <div style={itemsBox}>
                {prescription.items.map((item) => (
                  <div key={item.id} style={itemRow}>
                    <div style={itemName}>{item.medication}</div>

                    <div style={itemDetails}>
                      {item.presentation && (
                        <span>Presentación: {item.presentation}</span>
                      )}
                      {item.dosage && <span>Dosis: {item.dosage}</span>}
                      {item.frequency && (
                        <span>Frecuencia: {item.frequency}</span>
                      )}
                      {item.duration && <span>Duración: {item.duration}</span>}
                    </div>

                    {item.indications && (
                      <div style={indicationsText}>
                        {item.indications}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {prescription.generalNotes && (
              <div style={notesBox}>
                <strong>Notas generales:</strong> {prescription.generalNotes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================= */
/* STYLES */
/* ========================= */

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  marginBottom: 28,
};

const backLink: React.CSSProperties = {
  display: "inline-block",
  marginBottom: 14,
  fontSize: 14,
  color: "#2563EB",
  textDecoration: "none",
};

const pageTitle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 8,
};

const subtitle: React.CSSProperties = {
  fontSize: 14,
  color: "#6B7280",
};

const primaryButton: React.CSSProperties = {
  background: "#2563EB",
  color: "white",
  padding: "10px 16px",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const emptyCard: React.CSSProperties = {
  background: "white",
  border: "1px dashed #D1D5DB",
  borderRadius: 14,
  padding: 28,
  color: "#6B7280",
};

const emptyTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#111827",
  marginBottom: 8,
};

const emptyText: React.CSSProperties = {
  fontSize: 14,
  color: "#6B7280",
  marginBottom: 20,
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 22,
};

const cardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start",
  marginBottom: 16,
};

const cardTitle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 600,
  color: "#111827",
};

const cardMeta: React.CSSProperties = {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 4,
};

const diagnosisText: React.CSSProperties = {
  fontSize: 14,
  color: "#374151",
  marginTop: 8,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const secondaryButton: React.CSSProperties = {
  background: "#EEF2FF",
  color: "#2563EB",
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
};

const darkButton: React.CSSProperties = {
  background: "#111827",
  color: "white",
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
};

const itemsBox: React.CSSProperties = {
  borderTop: "1px solid #E5E7EB",
  paddingTop: 14,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const itemRow: React.CSSProperties = {
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 14,
};

const itemName: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
  marginBottom: 6,
};

const itemDetails: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  fontSize: 13,
  color: "#6B7280",
};

const indicationsText: React.CSSProperties = {
  fontSize: 13,
  color: "#374151",
  marginTop: 8,
  lineHeight: 1.6,
};

const notesBox: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 10,
  background: "#F9FAFB",
  fontSize: 14,
  color: "#374151",
};