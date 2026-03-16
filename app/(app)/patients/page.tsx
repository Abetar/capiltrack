import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  const { q } = await searchParams;

  const patients = await prisma.patient.findMany({
    where: {
      clinicId: user.clinicId,
      ...(q && {
        OR: [
          {
            firstName: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: q,
              mode: "insensitive",
            },
          },
        ],
      }),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 30,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: "#1F2937",
            }}
          >
            Pacientes
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginTop: 4,
            }}
          >
            Gestión de pacientes de la clínica
          </p>
        </div>

        <Link
          href="/patients/new"
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
          + Nuevo paciente
        </Link>
      </div>

      {/* SEARCH */}

      <form
        method="GET"
        style={{
          marginBottom: 20,
        }}
      >
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Buscar por nombre, email o teléfono..."
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            fontSize: 14,
          }}
        />
      </form>

      {/* LIST */}

      <div
        style={{
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
        }}
      >
        {patients.length === 0 && (
          <p style={{ padding: 20, color: "#6B7280" }}>
            No hay pacientes registrados.
          </p>
        )}

        {patients.map((p: (typeof patients)[number]) => (
          <div
            key={p.id}
            style={{
              padding: 20,
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <Link href={`/patients/${p.id}`}>
              <strong style={{ cursor: "pointer" }}>
                {p.firstName} {p.lastName ?? ""}
              </strong>
            </Link>

            <div
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginTop: 4,
              }}
            >
              {p.phone || "Sin teléfono"} • {p.email || "Sin email"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}