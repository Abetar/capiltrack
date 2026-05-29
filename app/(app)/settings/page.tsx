import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const { user, reason } = await getCurrentUser();

  if (!user) {
    return <div>Acceso restringido: {reason}</div>;
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
  });

  if (!clinic) {
    return <div>Clínica no encontrada</div>;
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>
        Configuración
      </h1>

      <SettingsForm
        clinicName={clinic.name}
        clinicLogoUrl={clinic.logoUrl}
        doctorName={clinic.doctorName}
        doctorLicense={clinic.doctorLicense}
        doctorPhone={clinic.doctorPhone}
      />
    </div>
  );
}