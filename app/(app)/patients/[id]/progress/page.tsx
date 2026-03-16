import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import ProgressChart from "@/components/metrics/ProgressChart";

export default async function PatientProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  const metrics = await prisma.hairMetric.findMany({
    where: {
      patientId: id,
      clinicId: user.clinicId,
    },
    include: {
      consultation: {
        select: {
          date: true,
        },
      },
    },
  });

  const zones = [
    "frontal",
    "crown",
    "donor",
    "left",
    "right",
    "top",
    "macro",
  ];

  const zoneLabels: Record<string, string> = {
    frontal: "Frontal",
    crown: "Coronilla",
    donor: "Zona donante",
    left: "Perfil izquierdo",
    right: "Perfil derecho",
    top: "Vista superior",
    macro: "Macro",
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600 }}>
          Progreso capilar
        </h1>

        <Link
          href={`/patients/${id}`}
          style={{
            fontSize: 14,
            color: "#6B7280",
            textDecoration: "none",
          }}
        >
          ← Volver al paciente
        </Link>
      </div>

      {zones.map((zone) => {
        const zoneMetrics = metrics
          .filter((m: (typeof metrics)[number]) => m.zone === zone)
          .sort(
            (
              a: (typeof metrics)[number],
              b: (typeof metrics)[number]
            ) => {
              const aDate = getMetricDate(a).getTime();
              const bDate = getMetricDate(b).getTime();
              return aDate - bDate;
            }
          );

        if (zoneMetrics.length === 0) return null;

        const chartData = zoneMetrics.map(
          (m: (typeof zoneMetrics)[number]) => ({
            date: getMetricDate(m).toLocaleDateString(),
            density: m.density ?? 0,
          })
        );

        return (
          <div
            key={zone}
            style={{
              marginBottom: 30,
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>
              {zoneLabels[zone]}
            </h2>

            <ProgressChart data={chartData} />

            <div style={{ marginTop: 16 }}>
              {zoneMetrics.map((m: (typeof zoneMetrics)[number]) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  <span>
                    {getMetricDate(m).toLocaleDateString()}
                  </span>

                  <span>
                    {m.density ?? "—"} grafts/cm²
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getMetricDate(metric: {
  createdAt: Date | string;
  consultation?: { date: Date | string } | null;
}) {
  if (metric.consultation?.date) {
    return new Date(metric.consultation.date);
  }

  return new Date(metric.createdAt);
}