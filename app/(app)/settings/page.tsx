import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const { user, reason } = await getCurrentUser();

  if (!user) {
    return <div>Acceso restringido: {reason}</div>;
  }

  const [clinic, scheduleSettings, scheduleAvailabilities] =
    await Promise.all([
      prisma.clinic.findUnique({
        where: {
          id: user.clinicId,
        },
      }),

      prisma.scheduleSettings.findUnique({
        where: {
          clinicId: user.clinicId,
        },
      }),

      prisma.scheduleAvailability.findMany({
        where: {
          clinicId: user.clinicId,
        },
        orderBy: {
          dayOfWeek: "asc",
        },
      }),
    ]);

  if (!clinic) {
    return <div>Clínica no encontrada</div>;
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>
        Configuración
      </h1>

      <SettingsForm
        clinicName={clinic.name}
        clinicLogoUrl={clinic.logoUrl}
        doctorName={clinic.doctorName}
        doctorLicense={clinic.doctorLicense}
        doctorPhone={clinic.doctorPhone}
        doctorSpecialty={clinic.doctorSpecialty}
        doctorBranch={clinic.doctorBranch}
        doctorUniversity={clinic.doctorUniversity}
        scheduleSettings={{
          timezone:
            scheduleSettings?.timezone ?? "America/Mexico_City",
          defaultAppointmentMinutes:
            scheduleSettings?.defaultAppointmentMinutes ?? 60,
          minimumBookingNoticeHours:
            scheduleSettings?.minimumBookingNoticeHours ?? 2,
          reminderHoursBefore:
            scheduleSettings?.reminderHoursBefore ?? 24,
        }}
        scheduleAvailabilities={scheduleAvailabilities.map(
          (availability) => ({
            dayOfWeek: availability.dayOfWeek,
            startTime: availability.startTime,
            endTime: availability.endTime,
            isActive: availability.isActive,
          }),
        )}
      />
    </div>
  );
}