import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";

export default async function ProceduresPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    technique?: string;
  }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  const { search = "", technique = "" } = await searchParams;

  const clinicId = user.clinicId;

  const whereClause = {
    clinicId,
    ...(technique
      ? {
          technique,
        }
      : {}),
    ...(search
      ? {
          patient: {
            OR: [
              {
                firstName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                lastName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          },
        }
      : {}),
  };

  const procedures = await prisma.transplantProcedure.findMany({
    where: whereClause,
    include: {
      patient: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  const totalProcedures = procedures.length;

  const totalGrafts = procedures.reduce((acc, p) => acc + (p.grafts ?? 0), 0);

  const avgGrafts =
    procedures.length > 0
      ? Math.round(
          procedures.reduce((acc, p) => acc + (p.grafts ?? 0), 0) /
            procedures.filter((p) => p.grafts !== null).length || 0
        )
      : 0;

  return (
    <div>
      {/* HEADER */}

      <div style={{ marginBottom: 30 }}>
        <h1 style={headerTitle}>Procedimientos de injerto</h1>

        <p style={headerSubtitle}>
          Registro global de procedimientos realizados
        </p>
      </div>

      {/* FILTROS */}

      <form method="GET" style={filtersCard}>
        <div style={filtersGrid}>
          <div>
            <label style={labelStyle}>Buscar paciente</label>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Nombre o apellido..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Filtrar por técnica</label>
            <select
              name="technique"
              defaultValue={technique}
              style={inputStyle}
            >
              <option value="">Todas</option>
              <option value="FUE">FUE</option>
              <option value="FUT">FUT</option>
              <option value="DHI">DHI</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "end", gap: 10 }}>
            <button type="submit" style={primaryButton}>
              Aplicar
            </button>

            <Link href="/procedures" style={secondaryButton}>
              Limpiar
            </Link>
          </div>
        </div>
      </form>

      {/* STATS */}

      <div style={statsGrid}>
        <StatCard title="Procedimientos" value={String(totalProcedures)} />
        <StatCard title="Total grafts" value={String(totalGrafts)} />
        <StatCard title="Promedio grafts" value={String(avgGrafts)} />
      </div>

      {/* TABLE */}

      <div style={tableWrapper}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Fecha</th>
              <th style={th}>Paciente</th>
              <th style={th}>Técnica</th>
              <th style={th}>Método</th>
              <th style={th}>Grafts</th>
              <th style={th}>Zona receptora</th>
              <th style={th}></th>
            </tr>
          </thead>

          <tbody>
            {procedures.map((p) => (
              <tr key={p.id} style={tr}>
                <td style={td}>{new Date(p.date).toLocaleDateString()}</td>

                <td style={td}>
                  {p.patient.firstName} {p.patient.lastName ?? ""}
                </td>

                <td style={td}>{p.technique ?? "—"}</td>

                <td style={td}>{p.method ?? "—"}</td>

                <td style={td}>{p.grafts ?? "—"}</td>

                <td style={td}>{p.recipientArea ?? "—"}</td>

                <td style={td}>
                  <Link href={`/patients/${p.patientId}`} style={viewButton}>
                    Ver paciente
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {procedures.length === 0 && (
          <p style={emptyText}>No hay procedimientos registrados.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div style={statCard}>
      <div style={statLabel}>{title}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

const headerTitle = {
  fontSize: 28,
  fontWeight: 600,
  color: "#1F2937",
};

const headerSubtitle = {
  fontSize: 14,
  color: "#6B7280",
  marginTop: 6,
};

const filtersCard = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 20,
  marginBottom: 20,
};

const filtersGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 16,
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  color: "#374151",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 14,
  background: "white",
};

const primaryButton = {
  background: "#2C6BED",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
};

const secondaryButton = {
  background: "white",
  color: "#374151",
  border: "1px solid #E5E7EB",
  padding: "10px 16px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 20,
  marginBottom: 20,
};

const statCard = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 20,
};

const statLabel = {
  fontSize: 13,
  color: "#6B7280",
  marginBottom: 8,
};

const statValue = {
  fontSize: 28,
  fontWeight: 600,
  color: "#1F2937",
};

const tableWrapper = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 20,
};

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const th = {
  textAlign: "left" as const,
  fontSize: 13,
  color: "#6B7280",
  paddingBottom: 10,
  borderBottom: "1px solid #E5E7EB",
};

const tr = {
  borderBottom: "1px solid #F3F4F6",
};

const td = {
  padding: "12px 0",
  fontSize: 14,
  color: "#1F2937",
};

const viewButton = {
  fontSize: 13,
  color: "#2563EB",
  textDecoration: "none",
};

const emptyText = {
  marginTop: 20,
  fontSize: 14,
  color: "#6B7280",
};