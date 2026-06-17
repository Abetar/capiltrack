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

    await prisma.transplantProcedure.update({
      where: { id: procedureId },
      data: {
        date: getDate(formData, "date") ?? p.date,
        technique: getString(formData, "technique"),
        method: getString(formData, "method"),
        grafts: getNumber(formData, "grafts"),
        donorArea: getString(formData, "donorArea"),
        recipientArea: getString(formData, "recipientArea"),
        notes: getString(formData, "notes"),

        anesthesiaType: getString(formData, "anesthesiaType"),
        anesthesiaMl: getNumber(formData, "anesthesiaMl"),

        extractionStart: getDate(formData, "extractionStart"),
        extractionEnd: getDate(formData, "extractionEnd"),
        implantationStart: getDate(formData, "implantationStart"),
        implantationEnd: getDate(formData, "implantationEnd"),

        medicalTeam: getString(formData, "medicalTeam"),
        nurses: getString(formData, "nurses"),
        observations: getString(formData, "observations"),
      },
    });

    redirect(`/patients/${id}/procedures`);
  }

  return (
    <div className="procedure-edit-page">
      <h1 className="procedure-edit-title">Editar procedimiento</h1>

      <form action={updateProcedure} className="procedure-edit-form">
        <Section title="Información básica">
          <div className="procedure-edit-grid">
            <Field label="Fecha">
              <input
                type="date"
                name="date"
                defaultValue={formatDate(p.date)}
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
        </Section>

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
                defaultValue={formatDateTime(p.extractionStart)}
                style={inputStyle}
              />
            </Field>

            <Field label="Fin extracción">
              <input
                type="datetime-local"
                name="extractionEnd"
                defaultValue={formatDateTime(p.extractionEnd)}
                style={inputStyle}
              />
            </Field>

            <Field label="Inicio implantación">
              <input
                type="datetime-local"
                name="implantationStart"
                defaultValue={formatDateTime(p.implantationStart)}
                style={inputStyle}
              />
            </Field>

            <Field label="Fin implantación">
              <input
                type="datetime-local"
                name="implantationEnd"
                defaultValue={formatDateTime(p.implantationEnd)}
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

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function getNumber(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return Number(value);
}

function getDate(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return new Date(value);
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatDateTime(date: Date | null) {
  if (!date) return "";

  return date.toISOString().slice(0, 16);
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
  minHeight: 90,
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