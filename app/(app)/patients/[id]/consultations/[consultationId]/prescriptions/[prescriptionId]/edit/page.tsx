import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function EditPrescriptionPage({
  params,
}: {
  params: Promise<{ id: string; consultationId: string; prescriptionId: string }>;
}) {
  const { id, consultationId, prescriptionId } = await params;

  const { user, reason } = await getCurrentUser();

  if (!user) {
    return <div>Acceso restringido: {reason}</div>;
  }

  const clinicId = user.clinicId;

  const prescription = await prisma.prescription.findFirst({
    where: {
      id: prescriptionId,
      patientId: id,
      consultationId,
      clinicId,
    },
    include: {
      patient: true,
      consultation: true,
      items: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!prescription) {
    return <div>Receta no encontrada</div>;
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      doctorName: true,
      doctorLicense: true,
      doctorPhone: true,
    },
  });

  const currentPrescriptionDate = prescription.date;

  async function updatePrescription(formData: FormData) {
    "use server";

    const date = formData.get("date") as string;

    const diagnosis = getString(formData, "diagnosis");
    const generalNotes = getString(formData, "generalNotes");

    const medications = formData.getAll("medication") as string[];
    const presentations = formData.getAll("presentation") as string[];
    const dosages = formData.getAll("dosage") as string[];
    const frequencies = formData.getAll("frequency") as string[];
    const durations = formData.getAll("duration") as string[];
    const indications = formData.getAll("indications") as string[];

    const items = medications
      .map((medication, index) => ({
        medication: medication?.trim(),
        presentation: presentations[index]?.trim() || null,
        dosage: dosages[index]?.trim() || null,
        frequency: frequencies[index]?.trim() || null,
        duration: durations[index]?.trim() || null,
        indications: indications[index]?.trim() || null,
        order: index + 1,
      }))
      .filter((item) => item.medication);

    if (items.length === 0) {
      throw new Error("Debes agregar al menos un medicamento.");
    }

    const clinicData = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        doctorName: true,
        doctorLicense: true,
        doctorPhone: true,
      },
    });

    await prisma.$transaction([
      prisma.prescriptionItem.deleteMany({
        where: { prescriptionId },
      }),

      prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          date: date ? new Date(date) : currentPrescriptionDate,
          diagnosis,
          generalNotes,
          doctorName: clinicData?.doctorName ?? null,
          doctorLicense: clinicData?.doctorLicense ?? null,
          doctorPhone: clinicData?.doctorPhone ?? null,
          items: {
            create: items,
          },
        },
      }),
    ]);

    redirect(`/patients/${id}/consultations/${consultationId}/prescriptions`);
  }

  const existingItems = [...prescription.items];

  while (existingItems.length < 5) {
    existingItems.push({
      id: `empty-${existingItems.length}`,
      prescriptionId: prescription.id,
      medication: "",
      presentation: null,
      dosage: null,
      frequency: null,
      duration: null,
      indications: null,
      order: existingItems.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href={`/patients/${id}/consultations/${consultationId}/prescriptions`}
          style={backLink}
        >
          ← Volver a recetas
        </Link>

        <h1 style={pageTitle}>Editar receta médica</h1>

        <p style={subtitle}>
          {prescription.patient.firstName} {prescription.patient.lastName ?? ""} ·{" "}
          Consulta del{" "}
          {new Date(prescription.consultation.date).toLocaleDateString()}
        </p>
      </div>

      <form action={updatePrescription} style={formStyle}>
        <Section title="Información de la receta">
          <Grid>
            <Field label="Fecha">
              <input
                type="date"
                name="date"
                defaultValue={formatDate(prescription.date)}
                style={inputStyle}
              />
            </Field>

            <Field label="Diagnóstico / motivo">
              <input
                name="diagnosis"
                defaultValue={prescription.diagnosis ?? ""}
                style={inputStyle}
                placeholder="Ej. Alopecia androgenética"
              />
            </Field>
          </Grid>

          <Field label="Notas generales">
            <textarea
              name="generalNotes"
              rows={3}
              defaultValue={prescription.generalNotes ?? ""}
              style={textareaStyle}
              placeholder="Indicaciones generales para el paciente"
            />
          </Field>
        </Section>

        <Section title="Datos del médico">
          <div style={doctorInfoBox}>
            <InfoItem
              label="Nombre"
              value={clinic?.doctorName || "No configurado"}
            />

            <InfoItem
              label="Cédula profesional"
              value={clinic?.doctorLicense || "No configurado"}
            />

            <InfoItem
              label="Teléfono"
              value={clinic?.doctorPhone || "No configurado"}
            />
          </div>

          <p style={helperText}>
            Estos datos se toman automáticamente desde Configuración.
          </p>
        </Section>

        <Section title="Medicamentos">
          {existingItems.slice(0, 5).map((item, index) => (
            <MedicationBlock
              key={item.id}
              index={index + 1}
              medication={item.medication}
              presentation={item.presentation}
              dosage={item.dosage}
              frequency={item.frequency}
              duration={item.duration}
              indications={item.indications}
            />
          ))}

          <p style={helperText}>
            Por ahora se permiten hasta 5 medicamentos por receta.
          </p>
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

function formatDate(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

function MedicationBlock({
  index,
  medication,
  presentation,
  dosage,
  frequency,
  duration,
  indications,
}: {
  index: number;
  medication: string | null;
  presentation: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  indications: string | null;
}) {
  return (
    <div style={medicationCard}>
      <h3 style={medicationTitle}>Medicamento {index}</h3>

      <Grid>
        <Field label="Medicamento">
          <input
            name="medication"
            defaultValue={medication ?? ""}
            style={inputStyle}
            placeholder="Ej. Finasteride"
          />
        </Field>

        <Field label="Presentación">
          <input
            name="presentation"
            defaultValue={presentation ?? ""}
            style={inputStyle}
            placeholder="Ej. Tabletas 1 mg"
          />
        </Field>

        <Field label="Dosis">
          <input
            name="dosage"
            defaultValue={dosage ?? ""}
            style={inputStyle}
            placeholder="Ej. 1 tableta"
          />
        </Field>

        <Field label="Frecuencia">
          <input
            name="frequency"
            defaultValue={frequency ?? ""}
            style={inputStyle}
            placeholder="Ej. Cada 24 horas"
          />
        </Field>

        <Field label="Duración">
          <input
            name="duration"
            defaultValue={duration ?? ""}
            style={inputStyle}
            placeholder="Ej. 3 meses"
          />
        </Field>
      </Grid>

      <Field label="Indicaciones">
        <textarea
          name="indications"
          rows={3}
          defaultValue={indications ?? ""}
          style={textareaStyle}
          placeholder="Ej. Tomar después de alimentos."
        />
      </Field>
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

const backLink: React.CSSProperties = {
  display: "inline-block",
  marginBottom: 14,
  fontSize: 14,
  color: "#2563EB",
  textDecoration: "none",
};

const pageTitle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 8,
};

const subtitle: React.CSSProperties = {
  fontSize: 14,
  color: "#6B7280",
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
  fontSize: 18,
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

const doctorInfoBox: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 16,
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 16,
};

const helperText: React.CSSProperties = {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 12,
  lineHeight: 1.5,
};

const medicationCard: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 18,
  marginBottom: 16,
  background: "#F9FAFB",
};

const medicationTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
  marginBottom: 14,
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