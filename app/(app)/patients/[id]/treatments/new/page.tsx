import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";

export default async function NewTreatmentPage({
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

  async function createTreatment(formData: FormData) {
    "use server";

    const medication = formData.get("medication") as string;
    const dosage = formData.get("dosage") as string;
    const frequency = formData.get("frequency") as string;
    const startDate = formData.get("startDate") as string;
    const notes = formData.get("notes") as string;

    if (!medication) {
      throw new Error("El medicamento es obligatorio");
    }

    await prisma.treatment.create({
      data: {
        clinicId,
        patientId: id,
        medication,
        dosage: dosage || null,
        frequency: frequency || null,
        startDate: startDate ? new Date(startDate) : null,
        notes: notes || null,
      },
    });

    redirect(`/patients/${id}/treatments`);
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
        Nuevo tratamiento
      </h1>

      <form action={createTreatment}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Medicamento</label>

          <input
            name="medication"
            required
            style={inputStyle}
            placeholder="Ej: Finasteride"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Dosis</label>

          <input name="dosage" style={inputStyle} placeholder="Ej: 1mg" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Frecuencia</label>

          <input
            name="frequency"
            style={inputStyle}
            placeholder="Ej: Diario"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Fecha inicio</label>

          <input type="date" name="startDate" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Notas</label>

          <textarea
            name="notes"
            rows={4}
            style={textareaStyle}
            placeholder="Observaciones del tratamiento"
          />
        </div>

        <button style={buttonStyle}>Guardar tratamiento</button>
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