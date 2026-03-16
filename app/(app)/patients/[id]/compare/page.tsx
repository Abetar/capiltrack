import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import TimelineComparisonSlider from "@/components/photos/TimelineComparisonSlider";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();

  if (!user) {
    return <div>No autorizado</div>;
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
    orderBy: {
      consultation: {
        date: "asc",
      },
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
        const zonePhotos = photos.filter(
          (p: (typeof photos)[number]) => p.zone === zone
        );

        if (zonePhotos.length < 2) return null;

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
                fontWeight: 600,
                marginBottom: 14,
                fontSize: 16,
              }}
            >
              {zoneLabels[zone] || zone}
            </div>

            <TimelineComparisonSlider photos={zonePhotos} />
          </div>
        );
      })}
    </div>
  );
}