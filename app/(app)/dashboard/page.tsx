import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import ClinicMetricsChart from "@/components/dashboard/ClinicMetricsChart";
import type { CSSProperties } from "react";

export default async function DashboardPage() {
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

  const clinicId = user.clinicId;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const oneTwentyDaysAgo = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);

  const [
    patientsCount,
    consultationsWeek,
    activeTreatments,
    proceduresCount,
    recentConsultations,
    consultationsYear,
    graftStats,
    patientsWithoutFollowup,
    treatmentsWithoutControl,
  ] = await Promise.all([
    prisma.patient.count({
      where: { clinicId },
    }),

    prisma.consultation.count({
      where: {
        clinicId,
        date: {
          gte: startOfWeek(),
        },
      },
    }),

    prisma.treatment.count({
      where: {
        clinicId,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
    }),

    prisma.transplantProcedure.count({
      where: { clinicId },
    }),

    prisma.consultation.findMany({
      where: { clinicId },
      include: {
        patient: true,
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
    }),

    prisma.consultation.findMany({
      where: {
        clinicId,
        date: {
          gte: startOfYear(),
        },
      },
      select: {
        date: true,
      },
    }),

    prisma.transplantProcedure.aggregate({
      where: {
        clinicId,
        grafts: {
          not: null,
        },
      },
      _avg: {
        grafts: true,
      },
    }),

    prisma.patient.findMany({
      where: {
        clinicId,
        consultations: {
          none: {
            date: {
              gte: ninetyDaysAgo,
            },
          },
        },
      },
      take: 5,
    }),

    prisma.treatment.findMany({
      where: {
        clinicId,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        patient: {
          consultations: {
            none: {
              date: {
                gte: oneTwentyDaysAgo,
              },
            },
          },
        },
      },
      include: {
        patient: true,
      },
      take: 5,
    }),
  ]);

  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const monthCounts = Array(12).fill(0);

  consultationsYear.forEach((c: (typeof consultationsYear)[number]) => {
    const month = new Date(c.date).getMonth();
    monthCounts[month]++;
  });

  const chartData = months.map((m, i) => ({
    date: m,
    consultations: monthCounts[i],
  }));

  const avgGrafts = Math.round(graftStats._avg.grafts ?? 0);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={headerTitle}>Dashboard</h1>
        <p style={headerSubtitle}>Resumen general de la clínica</p>
      </div>

      <div style={statsGrid}>
        <Card title="Pacientes activos" value={patientsCount} />
        <Card title="Consultas esta semana" value={consultationsWeek} />
        <Card title="Tratamientos activos" value={activeTreatments} />
        <Card title="Procedimientos realizados" value={proceduresCount} />
        <Card title="Promedio grafts/procedimiento" value={avgGrafts} />
      </div>

      <div style={{ ...cardStyle, marginTop: 30, marginBottom: 30 }}>
        <h2 style={cardTitle}>Alertas clínicas</h2>

        {patientsWithoutFollowup.length === 0 &&
        treatmentsWithoutControl.length === 0 ? (
          <p style={emptyText}>No hay alertas clínicas activas.</p>
        ) : (
          <div style={alertsContainer}>
            {patientsWithoutFollowup.map(
              (p: (typeof patientsWithoutFollowup)[number]) => (
                <Link
                  key={`follow-${p.id}`}
                  href={`/patients/${p.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={alertCardRed}>
                    ⚠ Paciente sin consulta en 90 días — {p.firstName}{" "}
                    {p.lastName ?? ""}
                  </div>
                </Link>
              ),
            )}

            {treatmentsWithoutControl.map(
              (t: (typeof treatmentsWithoutControl)[number]) => (
                <Link
                  key={`treatment-${t.id}`}
                  href={`/patients/${t.patientId}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={alertCardOrange}>
                    💊 Tratamiento activo sin consulta de control —{" "}
                    {t.patient.firstName} {t.patient.lastName ?? ""}
                  </div>
                </Link>
              ),
            )}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={cardTitle}>Consultas por mes</h2>
        <ClinicMetricsChart data={chartData} />
      </div>

      <div style={{ ...cardStyle, marginTop: 30 }}>
        <h2 style={cardTitle}>Actividad reciente</h2>

        {recentConsultations.length === 0 ? (
          <p style={emptyText}>Aún no hay actividad registrada.</p>
        ) : (
          <div style={activityList}>
            {recentConsultations.map(
              (c: (typeof recentConsultations)[number]) => (
                <Link
                  key={c.id}
                  href={`/patients/${c.patientId}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={activityCard}>
                    <div>
                      <div style={activityName}>
                        {c.patient.firstName} {c.patient.lastName ?? ""}
                      </div>

                      <div style={activityType}>Consulta clínica</div>
                    </div>

                    <div style={activityDate}>
                      {new Date(c.date).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div style={cardStat}>
      <p style={cardLabel}>{title}</p>
      <h2 style={cardValue}>{value}</h2>
    </div>
  );
}

const headerTitle: CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  color: "#1F2937",
};

const headerSubtitle: CSSProperties = {
  fontSize: 14,
  color: "#6B7280",
  marginTop: 6,
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 20,
  marginBottom: 40,
};

const cardStyle: CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 24,
};

const cardTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 20,
  color: "#1F2937",
};

const cardStat: CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 24,
};

const cardLabel: CSSProperties = {
  fontSize: 13,
  color: "#6B7280",
  marginBottom: 8,
};

const cardValue: CSSProperties = {
  fontSize: 30,
  fontWeight: 600,
  color: "#1F2937",
};

const emptyText: CSSProperties = {
  fontSize: 14,
  color: "#6B7280",
};

const alertsContainer: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const alertCardRed: CSSProperties = {
  border: "1px solid #FCA5A5",
  background: "#FEF2F2",
  padding: 12,
  borderRadius: 8,
  fontSize: 14,
  color: "#7F1D1D",
};

const alertCardOrange: CSSProperties = {
  border: "1px solid #FDBA74",
  background: "#FFF7ED",
  padding: 12,
  borderRadius: 8,
  fontSize: 14,
  color: "#9A3412",
};

const activityList: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const activityCard: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: 14,
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  cursor: "pointer",
};

const activityName: CSSProperties = {
  fontWeight: 500,
  color: "#111827",
};

const activityType: CSSProperties = {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 3,
};

const activityDate: CSSProperties = {
  fontSize: 13,
  color: "#6B7280",
};

function startOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function startOfYear() {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}
