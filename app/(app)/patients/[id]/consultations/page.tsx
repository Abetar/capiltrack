import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";

export default async function PatientConsultationsPage({
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

  const patient = await prisma.patient.findFirst({
    where: {
      id,
      clinicId: user.clinicId,
    },
  });

  if (!patient) {
    return <div>Paciente no encontrado</div>;
  }

  const consultations = await prisma.consultation.findMany({
    where: {
      patientId: patient.id,
      clinicId: user.clinicId,
    },
    orderBy: {
      date: "desc",
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            Consultas
          </h1>

          <Link
            href={`/patients/${patient.id}`}
            style={{
              fontSize: 14,
              textDecoration: "none",
              color: "#6B7280",
            }}
          >
            ← Volver al paciente
          </Link>
        </div>

        <Link
          href={`/patients/${patient.id}/consultations/new`}
          style={{
            background: "#2C6BED",
            color: "white",
            padding: "8px 14px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          + Nueva consulta
        </Link>
      </div>

      {/* LISTA */}

      {consultations.length === 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 24,
            color: "#6B7280",
          }}
        >
          Este paciente aún no tiene consultas registradas.
        </div>
      )}

      {consultations.map((c: (typeof consultations)[number]) => (
        <Link
          key={c.id}
          href={`/patients/${patient.id}/consultations/${c.id}`}
          style={{
            display: "block",
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {new Date(c.date).toLocaleDateString()}
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            Norwood: {c.norwoodLevel ?? "No registrado"}
          </div>

          {c.notes && (
            <div
              style={{
                marginTop: 10,
                fontSize: 14,
              }}
            >
              {c.notes}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
