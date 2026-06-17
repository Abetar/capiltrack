// app/(app)/patients/[id]/procedures/[procedureId]/page.tsx

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";

export default async function EditProcedurePage({
  params,
}: {
  params: Promise<{ id: string; procedureId: string }>;
}) {
  const { id, procedureId } = await params;

  const { user } = await getCurrentUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  const procedure = await prisma.transplantProcedure.findFirst({
    where: {
      id: procedureId,
      patientId: id,
      clinicId: user.clinicId,
    },
  });

  if (!procedure) {
    return <div>Procedimiento no encontrado</div>;
  }

  const p = procedure;

  async function updateProcedure(formData: FormData) {
    "use server";

    const date = formData.get("date") as string;
    const technique = formData.get("technique") as string;
    const method = formData.get("method") as string;
    const grafts = formData.get("grafts") as string;
    const donorArea = formData.get("donorArea") as string;
    const recipientArea = formData.get("recipientArea") as string;
    const notes = formData.get("notes") as string;

    const anesthesiaType = formData.get("anesthesiaType") as string;
    const anesthesiaMl = formData.get("anesthesiaMl") as string;

    const extractionStart = formData.get("extractionStart") as string;
    const extractionEnd = formData.get("extractionEnd") as string;

    const implantationStart = formData.get("implantationStart") as string;
    const implantationEnd = formData.get("implantationEnd") as string;

    const medicalTeam = formData.get("medicalTeam") as string;
    const nurses = formData.get("nurses") as string;
    const observations = formData.get("observations") as string;

    await prisma.transplantProcedure.update({
      where: { id: procedureId },
      data: {
        date: date ? new Date(date) : p.date,
        technique: technique || null,
        method: method || null,
        grafts: grafts ? Number(grafts) : null,
        donorArea: donorArea || null,
        recipientArea: recipientArea || null,
        notes: notes || null,

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
    <div className="procedure-edit-page">
      <h1 className="procedure-edit-title">Editar procedimiento</h1>

      <form action={updateProcedure} className="procedure-edit-form">
        <div className="procedure-edit-section">
          <h3 className="procedure-edit-section-title">Información básica</h3>

          <div className="procedure-edit-grid">
            <Field label="Fecha">
              <input
                type="date"
                name="date"
                defaultValue={p.date.toISOString().split("T")[0]}
                style={inputStyle}
              />
            </Field>

            <Field label="Técnica">
              <input
                name="technique"
                defaultValue={p.technique ?? ""}
                style={inputStyle}
                placeholder="Ej: FUE"
              />
            </Field>

            <Field label="Método">
              <input
                name="method"
                defaultValue={p.method ?? ""}
                style={inputStyle}
                placeholder="Ej: Sapphire"
              />
            </Field>

            <Field label="Grafts">
              <input
                name="grafts"
                type="number"
                defaultValue={p.grafts ?? ""}
                style={inputStyle}
              />
            </Field>

            <Field label="Zona donante">
              <input
                name="donorArea"
                defaultValue={p.donorArea ?? ""}
                style={inputStyle}
              />
            </Field>

            <Field label="Zona receptora">
              <input
                name="recipientArea"
                defaultValue={p.recipientArea ?? ""}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Notas">
            <textarea
              name="notes"
              defaultValue={p.notes ?? ""}
              style={textareaStyle}
            />
          </Field>
        </div>

        <Section title="Anestesia">
          <div className="procedure-edit-grid">
            <Field label="Tipo">
              <input
                name="anesthesiaType"
                defaultValue={p.anesthesiaType ?? ""}
                style={inputStyle}
              />
            </Field>

            <Field label="Cantidad (ml)">
              <input
                name="anesthesiaMl"
                type="number"
                defaultValue={p.anesthesiaMl ?? ""}
                style={inputStyle}
              />
            </Field>
          </div>
        </Section>

        <Section title="Tiempos quirúrgicos">
          <div className="procedure-edit-grid">
            <Field label="Inicio extracción">
              <input
                type="datetime-local"
                name="extractionStart"
                defaultValue={
                  p.extractionStart
                    ? p.extractionStart.toISOString().slice(0, 16)
                    : ""
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Fin extracción">
              <input
                type="datetime-local"
                name="extractionEnd"
                defaultValue={
                  p.extractionEnd
                    ? p.extractionEnd.toISOString().slice(0, 16)
                    : ""
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Inicio implantación">
              <input
                type="datetime-local"
                name="implantationStart"
                defaultValue={
                  p.implantationStart
                    ? p.implantationStart.toISOString().slice(0, 16)
                    : ""
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Fin implantación">
              <input
                type="datetime-local"
                name="implantationEnd"
                defaultValue={
                  p.implantationEnd
                    ? p.implantationEnd.toISOString().slice(0, 16)
                    : ""
                }
                style={inputStyle}
              />
            </Field>
          </div>
        </Section>

        <Section title="Equipo">
          <div className="procedure-edit-grid">
            <Field label="Equipo médico">
              <input
                name="medicalTeam"
                defaultValue={p.medicalTeam ?? ""}
                style={inputStyle}
              />
            </Field>

            <Field label="Enfermería">
              <input
                name="nurses"
                defaultValue={p.nurses ?? ""}
                style={inputStyle}
              />
            </Field>
          </div>
        </Section>

        <Field label="Observaciones">
          <textarea
            name="observations"
            defaultValue={p.observations ?? ""}
            style={textareaStyle}
          />
        </Field>

        <button className="procedure-edit-submit-button" style={buttonStyle}>
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="procedure-edit-field">
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="procedure-edit-section">
      <h3 className="procedure-edit-section-title">{title}</h3>
      {children}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 13,
  color: "#6B7280",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 14,
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 80,
};

const buttonStyle = {
  marginTop: 20,
  background: "#2C6BED",
  color: "white",
  padding: "12px 18px",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
}; 