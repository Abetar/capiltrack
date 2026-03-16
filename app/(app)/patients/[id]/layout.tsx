import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import Link from "next/link"

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {

  const { id } = await params

  const user = await getCurrentUser()

  if (!user) {
    return <div>No autorizado</div>
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id,
      clinicId: user.clinicId,
    },
  })

  if (!patient) {
    return <div>Paciente no encontrado</div>
  }

  return (
    <div style={{ maxWidth: 900 }}>

      {/* HEADER PACIENTE */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >

        <div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#1F2937",
            }}
          >
            {patient.firstName} {patient.lastName}
          </h1>

          <div
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginTop: 6,
            }}
          >
            {patient.phone || "Sin teléfono"} • {patient.email || "Sin email"}
          </div>

        </div>

        <Link
          href={`/patients/${patient.id}/edit`}
          style={{
            background: "#2C6BED",
            color: "white",
            padding: "10px 16px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Editar paciente
        </Link>

      </div>

      {/* TABS */}

      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 30,
          borderBottom: "1px solid #E5E7EB",
          paddingBottom: 10,
        }}
      >

        <Link
          href={`/patients/${patient.id}`}
          className="tab-link"
        >
          Resumen
        </Link>

        <Link
          href={`/patients/${patient.id}/consultations`}
          className="tab-link"
        >
          Consultas
        </Link>

        <Link
          href={`/patients/${patient.id}/progress`}
          className="tab-link"
        >
          Progreso
        </Link>

        <Link
          href={`/patients/${patient.id}/compare`}
          className="tab-link"
        >
          Comparar
        </Link>

        <Link
          href={`/patients/${patient.id}/treatments`}
          className="tab-link"
        >
          Tratamientos
        </Link>

        <Link
          href={`/patients/${patient.id}/procedures`}
          className="tab-link"
        >
          Procedimientos
        </Link>

      </div>

      {/* CONTENIDO DEL TAB */}

      {children}

    </div>
  )
}