import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";

export default async function PatientTreatmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

      {treatments.map((t: (typeof treatments)[number]) => (
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
          {/* MEDICAMENTO */}

          <div
            style={{
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {t.medication}
          </div>

          {/* DOSIS */}

          {t.dosage && (
            <div
              style={{
                fontSize: 13,
                color: "#6B7280",
              }}
            >
              Dosis: {t.dosage}
            </div>
          )}

          {/* FRECUENCIA */}

          {t.frequency && (
            <div
              style={{
                fontSize: 13,
                color: "#6B7280",
              }}
            >
              Frecuencia: {t.frequency}
            </div>
          )}

          {/* FECHAS */}

          <div
            style={{
              fontSize: 13,
              color: "#6B7280",
              marginTop: 6,
            }}
          >
            Inicio:{" "}
            {t.startDate ? new Date(t.startDate).toLocaleDateString() : "—"}
          </div>

          {t.endDate && (
            <div
              style={{
                fontSize: 13,
                color: "#6B7280",
              }}
            >
              Fin: {new Date(t.endDate).toLocaleDateString()}
            </div>
          )}

          {/* NOTAS */}

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
