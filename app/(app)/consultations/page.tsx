import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import {
  HiMagnifyingGlass,
  HiFunnel,
  HiEye,
  HiCalendarDays,
  HiUser,
  HiCamera,
  HiChartBar,
  HiClipboardDocumentList,
} from "react-icons/hi2";

export default async function ConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    norwood?: string;
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

  const { search = "", norwood = "" } = await searchParams;

  const clinicId = user.clinicId;

  const whereClause = {
    clinicId,
    ...(norwood
      ? {
          norwoodLevel: Number(norwood),
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

  const consultations = await prisma.consultation.findMany({
    where: whereClause,
    include: {
      patient: true,
      photos: true,
      metrics: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  const totalConsultations = consultations.length;

  const consultationsWithNorwood = consultations.filter(
    (c: (typeof consultations)[number]) => c.norwoodLevel !== null,
  );

  const avgNorwood =
    consultationsWithNorwood.length > 0
      ? (
          consultationsWithNorwood.reduce(
            (acc: number, c: (typeof consultations)[number]) =>
              acc + (c.norwoodLevel ?? 0),
            0,
          ) / consultationsWithNorwood.length
        ).toFixed(1)
      : "—";

  const totalPhotos = consultations.reduce(
    (acc: number, c: (typeof consultations)[number]) => acc + c.photos.length,
    0,
  );

  return (
    <div className="consultations-page">
      <div className="consultations-header" style={{ marginBottom: 30 }}>
        <h1 className="consultations-title" style={headerTitle}>
          Consultas clínicas
        </h1>

        <p className="consultations-subtitle" style={headerSubtitle}>
          Registro global de consultas realizadas en la clínica
        </p>
      </div>

      <form
        method="GET"
        className="consultations-filters-card"
        style={filtersCard}
      >
        <div className="consultations-filters-grid" style={filtersGrid}>
          <div>
            <label style={labelStyle}>Buscar paciente</label>

            <div className="consultations-input-wrapper">
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
            <label style={labelStyle}>Filtrar por Norwood</label>

            <div className="consultations-input-wrapper">
              <HiFunnel size={18} />

              <select name="norwood" defaultValue={norwood} style={inputStyle}>
                <option value="">Todos</option>
                <option value="1">Norwood 1</option>
                <option value="2">Norwood 2</option>
                <option value="3">Norwood 3</option>
                <option value="4">Norwood 4</option>
                <option value="5">Norwood 5</option>
                <option value="6">Norwood 6</option>
                <option value="7">Norwood 7</option>
              </select>
            </div>
          </div>

          <div className="consultations-filter-actions">
            <button type="submit" style={primaryButton}>
              Aplicar
            </button>

            <Link href="/consultations" style={secondaryButton}>
              Limpiar
            </Link>
          </div>
        </div>
      </form>

      <div className="consultations-stats-grid" style={statsGrid}>
        <StatCard title="Consultas" value={String(totalConsultations)} />
        <StatCard title="Norwood promedio" value={String(avgNorwood)} />
        <StatCard title="Fotos capturadas" value={String(totalPhotos)} />
      </div>

      <div className="consultations-table-wrapper" style={tableWrapper}>
        <table className="consultations-table" style={table}>
          <thead>
            <tr>
              <th style={th}>Fecha</th>
              <th style={th}>Paciente</th>
              <th style={th}>Norwood</th>
              <th style={th}>Fotos</th>
              <th style={th}>Métricas</th>
              <th style={th}></th>
            </tr>
          </thead>

          <tbody>
            {consultations.map((c: (typeof consultations)[number]) => (
              <tr key={c.id} style={tr}>
                <td style={td}>{new Date(c.date).toLocaleDateString()}</td>

                <td style={td}>
                  {c.patient.firstName} {c.patient.lastName ?? ""}
                </td>

                <td style={td}>{c.norwoodLevel ?? "—"}</td>

                <td style={td}>{c.photos.length}</td>

                <td style={td}>{c.metrics.length}</td>

                <td style={td}>
                  <Link
                    href={`/patients/${c.patientId}/consultations/${c.id}`}
                    style={viewButton}
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="consultations-mobile-list">
          {consultations.map((c: (typeof consultations)[number]) => (
            <article key={c.id} className="consultations-mobile-card">
              <div className="consultations-mobile-card-header">
                <div>
                  <div className="consultations-mobile-patient">
                    {c.patient.firstName} {c.patient.lastName ?? ""}
                  </div>

                  <div className="consultations-mobile-date">
                    <HiCalendarDays size={15} />
                    {new Date(c.date).toLocaleDateString()}
                  </div>
                </div>

                <Link
                  href={`/patients/${c.patientId}/consultations/${c.id}`}
                  className="consultations-mobile-view-button"
                >
                  <HiEye size={18} />
                </Link>
              </div>

              <div className="consultations-mobile-details">
                <MobileDetail
                  icon={<HiClipboardDocumentList size={16} />}
                  label="Norwood"
                  value={String(c.norwoodLevel ?? "—")}
                />

                <MobileDetail
                  icon={<HiCamera size={16} />}
                  label="Fotos"
                  value={String(c.photos.length)}
                />

                <MobileDetail
                  icon={<HiChartBar size={16} />}
                  label="Métricas"
                  value={String(c.metrics.length)}
                />

                <MobileDetail
                  icon={<HiUser size={16} />}
                  label="Paciente"
                  value={`${c.patient.firstName} ${c.patient.lastName ?? ""}`}
                />
              </div>
            </article>
          ))}
        </div>

        {consultations.length === 0 && (
          <p style={emptyText}>No hay consultas registradas.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="consultations-stat-card" style={statCard}>
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
    <div className="consultations-mobile-detail">
      <div className="consultations-mobile-detail-icon">{icon}</div>

      <div>
        <div className="consultations-mobile-detail-label">{label}</div>
        <div className="consultations-mobile-detail-value">{value}</div>
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