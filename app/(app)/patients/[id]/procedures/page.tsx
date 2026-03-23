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

  const procedures = await prisma.transplantProcedure.findMany({
    where: {
      patientId: id,
      clinicId: user.clinicId,
    },
    orderBy: {
      date: "desc",
    },
  });

  /* ========================= */
  /* STATS */
  /* ========================= */

  const totalProcedures = procedures.length;

  const totalGrafts = procedures.reduce(
    (acc: number, p: (typeof procedures)[number]) => {
      return acc + (p.grafts ?? 0);
    },
    0,
  );

  const avgGrafts =
    totalProcedures > 0 ? Math.round(totalGrafts / totalProcedures) : 0;

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
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            Procedimientos
          </h1>

          <div
            style={{
              fontSize: 13,
              color: "#6B7280",
              marginTop: 4,
            }}
          >
            {totalProcedures} procedimientos • {totalGrafts} grafts • promedio{" "}
            {avgGrafts}
          </div>
        </div>

        <Link
          href={`/patients/${id}/procedures/new`}
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
          + Nuevo procedimiento
        </Link>
      </div>

      {procedures.length === 0 && (
        <div
          style={{
            color: "#6B7280",
            fontSize: 14,
          }}
        >
          No hay procedimientos registrados
        </div>
      )}

      {procedures.map((p: (typeof procedures)[number]) => (
        <div
          key={p.id}
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
              {p.technique || "Procedimiento capilar"}
            </div>

            <DeleteProcedureButton procedureId={p.id} patientId={id} />
          </div>

          {/* GRAFTS */}

          <div
            style={{
              fontSize: 14,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            {p.grafts ? `${p.grafts} grafts` : ""}
          </div>

          {/* DATE */}

          <div
            style={{
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            Fecha: {new Date(p.date).toLocaleDateString()}
          </div>

          {/* ZONES */}

          {(p.donorArea || p.recipientArea) && (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: "#6B7280",
              }}
            >
              {p.donorArea && <>Zona donante: {p.donorArea} </>}
              {p.recipientArea && <>• Zona receptora: {p.recipientArea}</>}
            </div>
          )}

          {/* NOTES */}

          {p.notes && (
            <div
              style={{
                marginTop: 10,
                fontSize: 14,
              }}
            >
              {p.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
