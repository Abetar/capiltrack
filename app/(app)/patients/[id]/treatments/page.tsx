import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import DeleteTreatmentButton from "@/components/treatments/DeleteTreatmentButton";

export default async function PatientTreatmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  const treatments = await prisma.treatment.findMany({
    where: {
      patientId: id,
      clinicId: user.clinicId,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return (
    <div style={{ maxWidth: 900 }}>
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
          }}
        >
          Tratamientos
        </h1>

        <Link
          href={`/patients/${id}/treatments/new`}
          style={{
            background: "#2C6BED",
            color: "white",
            padding: "10px 16px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          + Nuevo tratamiento
        </Link>
      </div>

      {treatments.length === 0 && (
        <div
          style={{
            color: "#6B7280",
            fontSize: 14,
          }}
        >
          No hay tratamientos registrados
        </div>
      )}

      {treatments.map((t) => (
        <div
          key={t.id}
          style={{
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          {/* HEADER CARD */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontWeight: 600,
              }}
            >
              {t.medication}
            </div>

            <DeleteTreatmentButton
              treatmentId={t.id}
              patientId={id}
            />
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#374151",
              marginBottom: 4,
            }}
          >
            {t.dosage || "—"} {t.frequency ? `• ${t.frequency}` : ""}
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            Inicio:{" "}
            {t.startDate
              ? new Date(t.startDate).toLocaleDateString()
              : "No registrado"}
          </div>

          {t.notes && (
            <div
              style={{
                marginTop: 10,
                fontSize: 14,
              }}
            >
              {t.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}