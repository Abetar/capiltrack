import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import PhotoGrid from "@/components/photos/PhotoGrid";
import DeleteConsultationButton from "@/components/consultations/DeleteConsultationButton";
import {
  HiArrowLeft,
  HiCamera,
  HiChartBar,
  HiDocumentText,
  HiPencilSquare,
  HiPrinter,
  HiPlus,
} from "react-icons/hi2";

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
    <div className="consultation-detail-page" style={{ maxWidth: 900 }}>
      <div className="consultation-detail-header">
        <div>
          <h1 className="consultation-detail-title">Consulta</h1>

          <div className="consultation-detail-patient">
            {consultation.patient.firstName} {consultation.patient.lastName}
          </div>
        </div>

        <div className="consultation-detail-actions">
          <Link
            href={`/patients/${id}/consultations`}
            className="consultation-detail-back-link"
          >
            <HiArrowLeft size={18} />
            <span>Volver</span>
          </Link>

          <Link
            href={`/patients/${id}/consultations/${consultationId}/prescriptions`}
            className="consultation-detail-action consultation-detail-action-primary"
          >
            <HiDocumentText size={18} />
            <span>Recetas médicas</span>
          </Link>

          <div className="consultation-detail-delete-action">
            <DeleteConsultationButton
              consultationId={consultation.id}
              patientId={id}
            />
          </div>
        </div>
      </div>

      <div className="consultation-detail-card">
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

        <div style={{ marginTop: 24 }}>
          <div className="consultation-detail-section-header">
            <strong>Recetas médicas</strong>

            <Link
              href={`/patients/${id}/consultations/${consultationId}/prescriptions/new`}
              className="consultation-detail-small-action consultation-detail-small-action-dark"
            >
              <HiPlus size={16} />
              <span>Nueva receta</span>
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
              className="consultation-prescription-card"
            >
              <div className="consultation-prescription-header">
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

                <div className="consultation-prescription-actions">
                  <Link
                    href={`/patients/${id}/consultations/${consultationId}/prescriptions/${prescription.id}/edit`}
                    className="consultation-prescription-link"
                  >
                    <HiPencilSquare size={16} />
                    <span>Editar</span>
                  </Link>

                  <a
                    href={`/api/patients/${id}/consultations/${consultationId}/prescriptions/${prescription.id}/pdf`}
                    target="_blank"
                    className="consultation-prescription-link consultation-prescription-link-dark"
                  >
                    <HiPrinter size={16} />
                    <span>Imprimir PDF</span>
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

        <div style={{ marginTop: 24 }}>
          <strong>Métricas capilares</strong>

          {consultation.metrics.length === 0 && (
            <div style={{ color: "#6B7280", marginTop: 8 }}>
              No hay métricas registradas
            </div>
          )}

          {consultation.metrics.map(
            (m: (typeof consultation.metrics)[number]) => (
              <div key={m.id} className="consultation-metric-card">
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

      <div className="consultation-photos-section">
        <h2 className="consultation-photos-title">Fotos clínicas</h2>

        {consultation.photos.length === 0 && (
          <div style={{ color: "#6B7280", marginBottom: 16 }}>
            No hay fotos registradas
          </div>
        )}

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

        <div className="consultation-bottom-actions">
          <Link
            href={`/patients/${id}/consultations/${consultationId}/photos/new`}
            className="consultation-detail-action consultation-detail-action-primary"
          >
            <HiCamera size={18} />
            <span>Agregar foto</span>
          </Link>

          <Link
            href={`/patients/${id}/consultations/${consultationId}/metrics/new`}
            className="consultation-detail-action consultation-detail-action-dark"
          >
            <HiChartBar size={18} />
            <span>Agregar métricas</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
