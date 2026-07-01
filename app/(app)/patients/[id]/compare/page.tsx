import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import TimelineComparisonSlider from "@/components/photos/TimelineComparisonSlider";
import TimelineEditor from "./TimelineEditor";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user, reason } = await getCurrentUser();

  if (!user) {
    return <div>Acceso restringido: {reason}</div>;
  }

  const zones = ["frontal", "crown", "donor", "left", "right", "top", "macro"];

  const zoneLabels: Record<string, string> = {
    frontal: "Frontal",
    crown: "Coronilla",
    donor: "Zona donante",
    left: "Perfil izquierdo",
    right: "Perfil derecho",
    top: "Vista superior",
    macro: "Macro",
  };

  const photos = await prisma.photo.findMany({
    where: {
      patientId: id,
      clinicId: user.clinicId,
    },
    include: {
      consultation: true,
    },
  });

  if (photos.length < 2) {
    return <div>No hay suficientes fotos para comparar</div>;
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 600,
          marginBottom: 30,
        }}
      >
        Comparación capilar
      </h1>

      {zones.map((zone) => {
        const allZonePhotos = photos
          .filter((p: (typeof photos)[number]) => p.zone === zone)
          .sort((a, b) => {
            if (a.timelineOrder !== null && b.timelineOrder !== null) {
              return a.timelineOrder - b.timelineOrder;
            }

            if (a.timelineOrder !== null) return -1;
            if (b.timelineOrder !== null) return 1;

            const aDate = a.consultation?.date ?? a.createdAt;
            const bDate = b.consultation?.date ?? b.createdAt;

            return aDate.getTime() - bDate.getTime();
          });

        const visibleZonePhotos = allZonePhotos.filter(
          (photo) => !photo.excludeFromTimeline,
        );

        if (allZonePhotos.length < 2) return null;

        return (
          <div
            key={zone}
            style={{
              marginBottom: 50,
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {zoneLabels[zone] || zone}
              </div>

              <TimelineEditor
                patientId={id}
                zoneLabel={zoneLabels[zone] || zone}
                photos={allZonePhotos.map((photo) => ({
                  id: photo.id,
                  url: photo.url,
                  createdAt: photo.createdAt.toISOString(),
                  timelineOrder: photo.timelineOrder,
                  timelineLabel: photo.timelineLabel,
                  excludeFromTimeline: photo.excludeFromTimeline,
                  consultation: photo.consultation
                    ? {
                        date: photo.consultation.date.toISOString(),
                      }
                    : null,
                }))}
              />
            </div>

            {visibleZonePhotos.length >= 2 ? (
              <TimelineComparisonSlider photos={visibleZonePhotos} />
            ) : (
              <div style={{ fontSize: 14, color: "#6B7280" }}>
                No hay suficientes fotos visibles para comparar en esta zona.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}