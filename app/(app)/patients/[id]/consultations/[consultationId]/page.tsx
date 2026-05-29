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

  const { user, reason } = await getCurrentUser();

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          padding: 20,
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 32,
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
            Acceso restringido
          </h2>

          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
            {reason === "no_subscription" &&
              "Tu suscripción ha expirado o no está activa. Para continuar usando CapilTrack, necesitas renovar tu acceso."}

            {reason === "blocked" &&
              "Tu cuenta ha sido bloqueada. Contacta al administrador para más información."}

            {reason === "not_authenticated" &&
              "Debes iniciar sesión para acceder."}
          </p>

          {reason === "no_subscription" && (
            <a href="/api/stripe/checkout">
              <button
                style={{
                  background: "#2C6BED",
                  color: "white",
                  padding: "12px 20px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Reactivar suscripción
              </button>
            </a>
          )}
        </div>
      </div>
    );
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

  const photosWithoutZone = consultation.photos.filter(
    (p: (typeof consultation.photos)[number]) => !p.zone,
  );

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

          <Link
            href={`/patients/${id}/consultations/${consultationId}/prescriptions`}
            style={{
              background: "#2563EB",
              color: "white",
              padding: "10px 14px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Recetas médicas
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

        {/* RECETAS */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <strong>Recetas médicas</strong>

            <Link
              href={`/patients/${id}/consultations/${consultationId}/prescriptions/new`}
              style={{
                background: "#111827",
                color: "white",
                padding: "8px 12px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              + Nueva receta
            </Link>
          </div>

          {consultation.prescriptions.length === 0 && (
            <div style={{ color: "#6B7280", marginTop: 8, fontSize: 14 }}>
              No hay recetas registradas en esta consulta
            </div>
          )}

          {consultation.prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              style={{
                marginTop: 10,
                padding: 14,
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                background: "#F9FAFB",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#111827",
                      fontSize: 14,
                    }}
                  >
                    Receta — {new Date(prescription.date).toLocaleDateString()}
                  </div>

                  <div
                    style={{
                      color: "#6B7280",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {prescription.items.length} medicamento(s)
                  </div>

                  {prescription.diagnosis && (
                    <div
                      style={{
                        color: "#374151",
                        fontSize: 13,
                        marginTop: 6,
                      }}
                    >
                      <strong>Diagnóstico:</strong> {prescription.diagnosis}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link
                    href={`/patients/${id}/consultations/${consultationId}/prescriptions/${prescription.id}/edit`}
                    style={{
                      color: "#2563EB",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Editar
                  </Link>

                  <a
                    href={`/api/patients/${id}/consultations/${consultationId}/prescriptions/${prescription.id}/pdf`}
                    target="_blank"
                    style={{
                      color: "#111827",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Imprimir PDF
                  </a>
                </div>
              </div>

              {prescription.items.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {prescription.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        fontSize: 13,
                        color: "#374151",
                        marginBottom: 4,
                      }}
                    >
                      • {item.medication}
                      {item.dosage ? ` — ${item.dosage}` : ""}
                      {item.frequency ? ` — ${item.frequency}` : ""}
                    </div>
                  ))}

                  {prescription.items.length > 3 && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "#6B7280",
                        marginTop: 4,
                      }}
                    >
                      + {prescription.items.length - 3} medicamento(s) más
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* MÉTRICAS */}
        <div style={{ marginTop: 24 }}>
          <strong>Métricas capilares</strong>

          {consultation.metrics.length === 0 && (
            <div style={{ color: "#6B7280", marginTop: 8 }}>
              No hay métricas registradas
            </div>
          )}

          {consultation.metrics.map(
            (m: (typeof consultation.metrics)[number]) => (
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
            ),
          )}
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
          const zonePhotos = consultation.photos.filter(
            (p: (typeof consultation.photos)[number]) => p.zone === zone,
          );

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