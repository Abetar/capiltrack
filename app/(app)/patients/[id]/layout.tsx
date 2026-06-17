import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import {
  HiHome,
  HiClipboardDocumentList,
  HiChartBar,
  HiPhoto,
  HiBeaker,
  HiScissors,
  HiPencilSquare,
} from "react-icons/hi2";

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const patient = await prisma.patient.findFirst({
    where: {
      id,
      clinicId: user.clinicId,
    },
  });

  if (!patient) {
    return <div>Paciente no encontrado</div>;
  }

  const tabs = [
    {
      href: `/patients/${patient.id}`,
      label: "Resumen",
      icon: HiHome,
    },
    {
      href: `/patients/${patient.id}/consultations`,
      label: "Consultas",
      icon: HiClipboardDocumentList,
    },
    {
      href: `/patients/${patient.id}/progress`,
      label: "Progreso",
      icon: HiChartBar,
    },
    {
      href: `/patients/${patient.id}/compare`,
      label: "Comparar",
      icon: HiPhoto,
    },
    {
      href: `/patients/${patient.id}/treatments`,
      label: "Tratamientos",
      icon: HiBeaker,
    },
    {
      href: `/patients/${patient.id}/procedures`,
      label: "Procedimientos",
      icon: HiScissors,
    },
  ];

  return (
    <div className="patient-layout-container" style={{ maxWidth: 900 }}>
      <div
        className="patient-layout-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 16,
        }}
      >
        <div className="patient-layout-header-info">
          <h1
            className="patient-layout-title"
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#1F2937",
              margin: 0,
            }}
          >
            {patient.firstName} {patient.lastName}
          </h1>

          <div
            className="patient-layout-meta"
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginTop: 6,
              wordBreak: "break-word",
            }}
          >
            {patient.phone || "Sin teléfono"} • {patient.email || "Sin email"}
          </div>
        </div>

        <Link
          href={`/patients/${patient.id}/edit`}
          className="patient-layout-edit-button"
          style={{
            background: "#2C6BED",
            color: "white",
            padding: "10px 16px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="patient-layout-edit-text">
            Editar paciente
          </span>

          <span className="patient-layout-edit-icon">
            <HiPencilSquare size={18} />
          </span>
        </Link>
      </div>

      <div
        className="patient-layout-tabs"
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 30,
          borderBottom: "1px solid #E5E7EB",
          paddingBottom: 10,
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="tab-link patient-layout-tab-link"
            >
              <span className="patient-layout-tab-icon">
                <Icon size={18} />
              </span>

              <span className="patient-layout-tab-text">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}