import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";

export default async function NewProcedurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();

  if (!user) {
    return <div>No autorizado</div>;
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

          <input
            type="date"
            name="date"
            required
            style={inputStyle}
          />
        </div>

        {/* TÉCNICA */}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Técnica</label>

          <input
            name="technique"
            style={inputStyle}
            placeholder="Ej: FUE"
          />
        </div>

        {/* MÉTODO */}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Método</label>

          <input
            name="method"
            style={inputStyle}
            placeholder="Ej: Sapphire"
          />
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

        <button style={buttonStyle}>
          Guardar procedimiento
        </button>
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