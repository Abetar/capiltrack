//app/(app)/patients/[id]/consultations/[consultationId]/page.tsx

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import PhotoGrid from "@/components/photos/PhotoGrid";
import DeleteConsultationButton from "@/components/consultations/DeleteConsultationButton";

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string; consultationId: string }>;
}) {
  const { id, consultationId } = await params;

  const user = await getCurrentUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  const consultation = await prisma.consultation.findFirst({
    where: {
      id: consultationId,
      clinicId: user.clinicId,
      patientId: id,
    },
    include: {
      patient: true,
      photos: true,
      metrics: true,
    },
  });

  if (!consultation) {
    return <div>Consulta no encontrada</div>;
  }

  const zones = ["frontal", "crown", "donor", "left", "right", "top", "macro"];

  const zoneLabels: Record<string, string> = {
    frontal: "Frontal",
    crown: "Coronilla",
    donor: "Zona donante",
    left: "Perfil izquierdo",
    right: "Perfil derecho",
    top: "Vista superior",
    macro: "Macro",
  };

  const photosWithoutZone = consultation.photos.filter((p) => !p.zone);

  return (
    <div style={{ maxWidth: 900 }}>
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 30,
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            Consulta
          </h1>

          <div
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginTop: 6,
            }}
          >
            {consultation.patient.firstName} {consultation.patient.lastName}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            href={`/patients/${id}/consultations`}
            style={{
              textDecoration: "none",
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            ← Volver
          </Link>

          <DeleteConsultationButton
            consultationId={consultation.id}
            patientId={id}
          />
        </div>
      </div>

      {/* INFO CONSULTA */}

      <div
        style={{
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <strong>Fecha:</strong>{" "}
          {new Date(consultation.date).toLocaleDateString()}
        </div>

        <div style={{ marginBottom: 16 }}>
          <strong>Grado Norwood:</strong>{" "}
          {consultation.norwoodLevel ?? "No registrado"}
        </div>

        <div>
          <strong>Notas:</strong>

          <div style={{ marginTop: 8 }}>
            {consultation.notes || "Sin notas"}
          </div>
        </div>

        {/* MÉTRICAS */}

        <div style={{ marginTop: 24 }}>
          <strong>Métricas capilares</strong>

          {consultation.metrics.length === 0 && (
            <div style={{ color: "#6B7280", marginTop: 8 }}>
              No hay métricas registradas
            </div>
          )}

          {consultation.metrics.map((m) => (
            <div
              key={m.id}
              style={{
                marginTop: 8,
                padding: 12,
                border: "1px solid #E5E7EB",
                borderRadius: 8,
              }}
            >
              <div>
                <strong>Densidad:</strong> {m.density ?? "—"} grafts/cm²
              </div>

              <div>
                <strong>Grosor:</strong> {m.thickness ?? "—"} μm
              </div>

              {m.zone && (
                <div>
                  <strong>Zona:</strong> {zoneLabels[m.zone] || m.zone}
                </div>
              )}

              {m.notes && (
                <div>
                  <strong>Notas:</strong> {m.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FOTOS CLÍNICAS */}

      <div style={{ marginTop: 40 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          Fotos clínicas
        </h2>

        {consultation.photos.length === 0 && (
          <div style={{ color: "#6B7280", marginBottom: 16 }}>
            No hay fotos registradas
          </div>
        )}

        {/* FOTOS POR ZONA */}

        {zones.map((zone) => {
          const zonePhotos = consultation.photos.filter((p) => p.zone === zone);

          if (zonePhotos.length === 0) return null;

          return (
            <div key={zone} style={{ marginBottom: 30 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                {zoneLabels[zone] || zone}
              </h3>

              <PhotoGrid photos={zonePhotos} />
            </div>
          );
        })}

        {/* FOTOS SIN ZONA */}

        {photosWithoutZone.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              Otras fotos
            </h3>

            <PhotoGrid photos={photosWithoutZone} />
          </div>
        )}

        <Link
          href={`/patients/${id}/consultations/${consultationId}/photos/new`}
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
          + Agregar foto
        </Link>

        <Link
          href={`/patients/${id}/consultations/${consultationId}/metrics/new`}
          style={{
            background: "#111827",
            color: "white",
            padding: "10px 16px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
            marginLeft: 10,
          }}
        >
          + Agregar métricas
        </Link>
      </div>
    </div>
  );
}