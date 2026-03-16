import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
// import Link from "next/link";

export default async function ProceduresPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  const procedures = await prisma.transplantProcedure.findMany({
    where: {
      clinicId: user.clinicId,
    },
    orderBy: {
      date: "desc",
    },
    include: {
      patient: true,
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
    0
  );

  const avgGrafts =
    procedures.length > 0
      ? Math.round(totalGrafts / procedures.length)
      : 0;

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
      </div>

      {/* LIST */}

      <div
        style={{
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
        }}
      >
        {procedures.length === 0 && (
          <p style={{ padding: 20, color: "#6B7280" }}>
            No hay procedimientos registrados.
          </p>
        )}

        {procedures.map((p: (typeof procedures)[number]) => (
          <div
            key={p.id}
            style={{
              padding: 20,
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {p.technique || "Procedimiento capilar"}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginTop: 4,
              }}
            >
              {p.patient.firstName} {p.patient.lastName ?? ""}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginTop: 4,
              }}
            >
              {p.grafts ? `${p.grafts} grafts` : ""}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginTop: 4,
              }}
            >
              Fecha: {new Date(p.date).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}