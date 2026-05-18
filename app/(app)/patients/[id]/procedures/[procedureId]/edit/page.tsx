import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function EditProcedurePage({
  params,
}: {
  params: Promise<{ id: string; procedureId: string }>;
}) {
  const { id, procedureId } = await params;

  const { user, reason } = await getCurrentUser();

  if (!user) {
    return <div>Acceso restringido: {reason}</div>;
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

  const clinicId = user.clinicId;

  async function updateProcedure(formData: FormData) {
    "use server";

    const date = formData.get("date") as string;

    if (!date) {
      throw new Error("La fecha es obligatoria");
    }

    await prisma.transplantProcedure.update({
      where: {
        id: procedureId,
      },
      data: {
        clinicId,
        patientId: id,

        date: new Date(date),

        technique: getString(formData, "technique"),
        method: getString(formData, "method"),

        grafts: getNumber(formData, "grafts"),

        extractedFollicularUnits: getNumber(
          formData,
          "extractedFollicularUnits"
        ),
        implantedFollicularUnits: getNumber(
          formData,
          "implantedFollicularUnits"
        ),

        extractedFollicles: getNumber(formData, "extractedFollicles"),
        implantedFollicles: getNumber(formData, "implantedFollicles"),

        donorArea: getString(formData, "donorArea"),
        recipientArea: getString(formData, "recipientArea"),

        anesthesiaType: getString(formData, "anesthesiaType"),
        anesthesiaMl: getNumber(formData, "anesthesiaMl"),

        extractionStart: getDate(formData, "extractionStart"),
        extractionEnd: getDate(formData, "extractionEnd"),

        implantationStart: getDate(formData, "implantationStart"),
        implantationEnd: getDate(formData, "implantationEnd"),

        medicalTeam: getString(formData, "medicalTeam"),
        nurses: getString(formData, "nurses"),

        notes: getString(formData, "notes"),
        observations: getString(formData, "observations"),
      },
    });

    redirect(`/patients/${id}/procedures`);
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href={`/patients/${id}/procedures`}
          style={{
            color: "#2563EB",
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          ← Volver a procedimientos
        </Link>
      </div>

      <h1 style={pageTitle}>Editar procedimiento</h1>

      <form action={updateProcedure} style={formStyle}>
        <Section title="Información general">
          <Grid>
            <Field label="Fecha">
              <input
                type="date"
                name="date"
                required
                defaultValue={formatDate(procedure.date)}
                style={inputStyle}
              />
            </Field>

            <Field label="Técnica">
              <input
                name="technique"
                defaultValue={procedure.technique ?? ""}
                style={inputStyle}
                placeholder="Ej: FUE"
              />
            </Field>

            <Field label="Método">
              <input
                name="method"
                defaultValue={procedure.method ?? ""}
                style={inputStyle}
                placeholder="Ej: Sapphire"
              />
            </Field>

            <Field label="Grafts">
              <input
                name="grafts"
                type="number"
                min="0"
                defaultValue={procedure.grafts ?? ""}
                style={inputStyle}
                placeholder="Ej: 3500"
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Conteo de extracción e implantación">
          <Grid>
            <Field label="UF extraídas">
              <input
                name="extractedFollicularUnits"
                type="number"
                min="0"
                defaultValue={procedure.extractedFollicularUnits ?? ""}
                style={inputStyle}
                placeholder="Ej: 3200"
              />
            </Field>

            <Field label="UF implantadas">
              <input
                name="implantedFollicularUnits"
                type="number"
                min="0"
                defaultValue={procedure.implantedFollicularUnits ?? ""}
                style={inputStyle}
                placeholder="Ej: 3150"
              />
            </Field>

            <Field label="Folículos extraídos">
              <input
                name="extractedFollicles"
                type="number"
                min="0"
                defaultValue={procedure.extractedFollicles ?? ""}
                style={inputStyle}
                placeholder="Ej: 6500"
              />
            </Field>

            <Field label="Folículos implantados">
              <input
                name="implantedFollicles"
                type="number"
                min="0"
                defaultValue={procedure.implantedFollicles ?? ""}
                style={inputStyle}
                placeholder="Ej: 6300"
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Zonas tratadas">
          <Grid>
            <Field label="Zona donante">
              <input
                name="donorArea"
                defaultValue={procedure.donorArea ?? ""}
                style={inputStyle}
                placeholder="Ej: Occipital"
              />
            </Field>

            <Field label="Zona receptora">
              <input
                name="recipientArea"
                defaultValue={procedure.recipientArea ?? ""}
                style={inputStyle}
                placeholder="Ej: Frontal, entradas, coronilla"
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Anestesia">
          <Grid>
            <Field label="Tipo de anestesia">
              <input
                name="anesthesiaType"
                defaultValue={procedure.anesthesiaType ?? ""}
                style={inputStyle}
                placeholder="Ej: Local"
              />
            </Field>

            <Field label="ML de anestesia">
              <input
                name="anesthesiaMl"
                type="number"
                step="0.1"
                min="0"
                defaultValue={procedure.anesthesiaMl ?? ""}
                style={inputStyle}
                placeholder="Ej: 12"
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Tiempos del procedimiento">
          <Grid>
            <Field label="Inicio extracción">
              <input
                name="extractionStart"
                type="datetime-local"
                defaultValue={formatDateTime(procedure.extractionStart)}
                style={inputStyle}
              />
            </Field>

            <Field label="Fin extracción">
              <input
                name="extractionEnd"
                type="datetime-local"
                defaultValue={formatDateTime(procedure.extractionEnd)}
                style={inputStyle}
              />
            </Field>

            <Field label="Inicio implantación">
              <input
                name="implantationStart"
                type="datetime-local"
                defaultValue={formatDateTime(procedure.implantationStart)}
                style={inputStyle}
              />
            </Field>

            <Field label="Fin implantación">
              <input
                name="implantationEnd"
                type="datetime-local"
                defaultValue={formatDateTime(procedure.implantationEnd)}
                style={inputStyle}
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Equipo médico">
          <Grid>
            <Field label="Equipo médico">
              <input
                name="medicalTeam"
                defaultValue={procedure.medicalTeam ?? ""}
                style={inputStyle}
                placeholder="Ej: Dr. Sánchez + equipo quirúrgico"
              />
            </Field>

            <Field label="Enfermería">
              <input
                name="nurses"
                defaultValue={procedure.nurses ?? ""}
                style={inputStyle}
                placeholder="Ej: Ana Martínez / Laura Rivas"
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Notas y observaciones">
          <Field label="Notas">
            <textarea
              name="notes"
              rows={4}
              defaultValue={procedure.notes ?? ""}
              style={textareaStyle}
              placeholder="Detalles generales del procedimiento"
            />
          </Field>

          <Field label="Observaciones">
            <textarea
              name="observations"
              rows={4}
              defaultValue={procedure.observations ?? ""}
              style={textareaStyle}
              placeholder="Observaciones clínicas o quirúrgicas"
            />
          </Field>
        </Section>

        <button type="submit" style={buttonStyle}>
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key) as string | null;
  return value && value.trim() ? value.trim() : null;
}

function getNumber(formData: FormData, key: string) {
  const value = formData.get(key) as string | null;
  return value && value !== "" ? Number(value) : null;
}

function getDate(formData: FormData, key: string) {
  const value = formData.get(key) as string | null;
  return value ? new Date(value) : null;
}

function formatDate(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatDateTime(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={gridStyle}>{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const pageTitle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 600,
  marginBottom: 24,
  color: "#111827",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const sectionStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 22,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 600,
  color: "#111827",
  marginBottom: 18,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "#6B7280",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  fontSize: 14,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  fontSize: 14,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  background: "#2563EB",
  color: "white",
  padding: "12px 18px",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};