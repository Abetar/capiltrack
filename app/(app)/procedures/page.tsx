import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import {
  HiMagnifyingGlass,
  HiFunnel,
  HiEye,
  HiCalendarDays,
  HiUser,
  HiScissors,
  HiMapPin,
  HiChartBar,
} from "react-icons/hi2";

export default async function ProceduresPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    technique?: string;
  }>;
}) {
  const { user, reason } = await getCurrentUser();

  if (!user) {
    return (
      <div style={restrictedWrapper}>
        <div style={restrictedCard}>
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
              <button style={reactivateButton}>Reactivar suscripción</button>
            </a>
          )}
        </div>
      </div>
    );
  }

  const { search = "", technique = "" } = await searchParams;

  const clinicId = user.clinicId;

  const whereClause = {
    clinicId,
    ...(technique ? { technique } : {}),
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

  const totalGrafts = procedures.reduce(
    (acc: number, p: (typeof procedures)[number]) => acc + (p.grafts ?? 0),
    0,
  );

  const graftProcedures = procedures.filter(
    (p: (typeof procedures)[number]) => p.grafts !== null,
  );

  const avgGrafts =
    graftProcedures.length > 0
      ? Math.round(
          graftProcedures.reduce(
            (acc: number, p: (typeof procedures)[number]) =>
              acc + (p.grafts ?? 0),
            0,
          ) / graftProcedures.length,
        )
      : 0;

  return (
    <div className="procedures-page">
      <div className="procedures-header" style={{ marginBottom: 30 }}>
        <h1 className="procedures-title" style={headerTitle}>
          Procedimientos de injerto
        </h1>

        <p className="procedures-subtitle" style={headerSubtitle}>
          Registro global de procedimientos realizados
        </p>
      </div>

      <form method="GET" className="procedures-filters-card" style={filtersCard}>
        <div className="procedures-filters-grid" style={filtersGrid}>
          <div>
            <label style={labelStyle}>Buscar paciente</label>
            <div className="procedures-input-wrapper">
              <HiMagnifyingGlass size={18} />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Nombre o apellido..."
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Filtrar por técnica</label>
            <div className="procedures-input-wrapper">
              <HiFunnel size={18} />
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
          </div>

          <div className="procedures-filter-actions">
            <button type="submit" style={primaryButton}>
              Aplicar
            </button>

            <Link href="/procedures" style={secondaryButton}>
              Limpiar
            </Link>
          </div>
        </div>
      </form>

      <div className="procedures-stats-grid" style={statsGrid}>
        <StatCard title="Procedimientos" value={String(totalProcedures)} />
        <StatCard title="Total grafts" value={String(totalGrafts)} />
        <StatCard title="Promedio grafts" value={String(avgGrafts)} />
      </div>

      <div className="procedures-table-wrapper" style={tableWrapper}>
        <table className="procedures-table" style={table}>
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
            {procedures.map((p: (typeof procedures)[number]) => (
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

        <div className="procedures-mobile-list">
          {procedures.map((p: (typeof procedures)[number]) => (
            <article key={p.id} className="procedures-mobile-card">
              <div className="procedures-mobile-card-header">
                <div>
                  <div className="procedures-mobile-patient">
                    {p.patient.firstName} {p.patient.lastName ?? ""}
                  </div>

                  <div className="procedures-mobile-date">
                    <HiCalendarDays size={15} />
                    {new Date(p.date).toLocaleDateString()}
                  </div>
                </div>

                <Link
                  href={`/patients/${p.patientId}`}
                  className="procedures-mobile-view-button"
                >
                  <HiEye size={18} />
                </Link>
              </div>

              <div className="procedures-mobile-details">
                <MobileDetail
                  icon={<HiScissors size={16} />}
                  label="Técnica"
                  value={p.technique ?? "—"}
                />

                <MobileDetail
                  icon={<HiChartBar size={16} />}
                  label="Grafts"
                  value={String(p.grafts ?? "—")}
                />

                <MobileDetail
                  icon={<HiUser size={16} />}
                  label="Método"
                  value={p.method ?? "—"}
                />

                <MobileDetail
                  icon={<HiMapPin size={16} />}
                  label="Zona"
                  value={p.recipientArea ?? "—"}
                />
              </div>
            </article>
          ))}
        </div>

        {procedures.length === 0 && (
          <p style={emptyText}>No hay procedimientos registrados.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="procedures-stat-card" style={statCard}>
      <div style={statLabel}>{title}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

function MobileDetail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="procedures-mobile-detail">
      <div className="procedures-mobile-detail-icon">{icon}</div>

      <div>
        <div className="procedures-mobile-detail-label">{label}</div>
        <div className="procedures-mobile-detail-value">{value}</div>
      </div>
    </div>
  );
}

const restrictedWrapper = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F8FAFC",
  padding: 20,
};

const restrictedCard = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 32,
  maxWidth: 420,
  width: "100%",
  textAlign: "center" as const,
};

const reactivateButton = {
  background: "#2C6BED",
  color: "white",
  padding: "12px 20px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

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