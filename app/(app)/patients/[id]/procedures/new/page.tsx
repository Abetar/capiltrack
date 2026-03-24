import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";

export default async function NewProcedurePage({
  params,
}: {
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

  const clinicId = user.clinicId;

  async function createProcedure(formData: FormData) {
    "use server";

    const date = formData.get("date") as string;
    const technique = formData.get("technique") as string;
    const method = formData.get("method") as string;
    const grafts = formData.get("grafts") as string;
    const donorArea = formData.get("donorArea") as string;
    const recipientArea = formData.get("recipientArea") as string;
    const notes = formData.get("notes") as string;

    // NUEVOS CAMPOS
    const anesthesiaType = formData.get("anesthesiaType") as string;
    const anesthesiaMl = formData.get("anesthesiaMl") as string;

    const extractionStart = formData.get("extractionStart") as string;
    const extractionEnd = formData.get("extractionEnd") as string;

    const implantationStart = formData.get("implantationStart") as string;
    const implantationEnd = formData.get("implantationEnd") as string;

    const medicalTeam = formData.get("medicalTeam") as string;
    const nurses = formData.get("nurses") as string;
    const observations = formData.get("observations") as string;

    if (!date) {
      throw new Error("La fecha es obligatoria");
    }

    await prisma.transplantProcedure.create({
      data: {
        clinicId,
        patientId: id,
        date: new Date(date),
        technique: technique || null,
        method: method || null,
        grafts: grafts ? Number(grafts) : null,
        donorArea: donorArea || null,
        recipientArea: recipientArea || null,
        notes: notes || null,

        // NUEVOS CAMPOS
        anesthesiaType: anesthesiaType || null,
        anesthesiaMl: anesthesiaMl ? Number(anesthesiaMl) : null,

        extractionStart: extractionStart ? new Date(extractionStart) : null,
        extractionEnd: extractionEnd ? new Date(extractionEnd) : null,

        implantationStart: implantationStart
          ? new Date(implantationStart)
          : null,
        implantationEnd: implantationEnd
          ? new Date(implantationEnd)
          : null,

        medicalTeam: medicalTeam || null,
        nurses: nurses || null,
        observations: observations || null,
      },
    });

    redirect(`/patients/${id}/procedures`);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 600,
          marginBottom: 24,
        }}
      >
        Nuevo procedimiento
      </h1>

      <form action={createProcedure}>
        {/* FECHA */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Fecha</label>
          <input type="date" name="date" required style={inputStyle} />
        </div>

        {/* TÉCNICA */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Técnica</label>
          <input name="technique" style={inputStyle} placeholder="Ej: FUE" />
        </div>

        {/* MÉTODO */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Método</label>
          <input name="method" style={inputStyle} placeholder="Ej: Sapphire" />
        </div>

        {/* GRAFTS */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Grafts</label>
          <input
            name="grafts"
            type="number"
            style={inputStyle}
            placeholder="Ej: 3500"
          />
        </div>

        {/* ZONA DONANTE */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Zona donante</label>
          <input
            name="donorArea"
            style={inputStyle}
            placeholder="Ej: Occipital"
          />
        </div>

        {/* ZONA RECEPTORA */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Zona receptora</label>
          <input
            name="recipientArea"
            style={inputStyle}
            placeholder="Ej: Frontal"
          />
        </div>

        {/* NOTAS */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Notas</label>
          <textarea
            name="notes"
            rows={4}
            style={textareaStyle}
            placeholder="Detalles del procedimiento"
          />
        </div>

        {/* ANESTESIA */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Tipo de anestesia</label>
          <input name="anesthesiaType" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>ML anestesia</label>
          <input name="anesthesiaMl" type="number" style={inputStyle} />
        </div>

        {/* TIEMPOS */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Inicio extracción</label>
          <input
            name="extractionStart"
            type="datetime-local"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Fin extracción</label>
          <input
            name="extractionEnd"
            type="datetime-local"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Inicio implantación</label>
          <input
            name="implantationStart"
            type="datetime-local"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Fin implantación</label>
          <input
            name="implantationEnd"
            type="datetime-local"
            style={inputStyle}
          />
        </div>

        {/* METADATA */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Equipo médico</label>
          <input name="medicalTeam" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Enfermería</label>
          <input name="nurses" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Observaciones</label>
          <textarea name="observations" rows={3} style={textareaStyle} />
        </div>

        <button style={buttonStyle}>Guardar procedimiento</button>
      </form>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 14,
  marginBottom: 6,
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 14,
};

const textareaStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 14,
};

const buttonStyle = {
  background: "#2C6BED",
  color: "white",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};