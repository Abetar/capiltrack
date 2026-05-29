"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SettingsFormProps = {
  clinicName: string;
  clinicLogoUrl: string | null;
  doctorName: string | null;
  doctorLicense: string | null;
  doctorPhone: string | null;
};

export default function SettingsForm({
  clinicName,
  clinicLogoUrl,
  doctorName,
  doctorLicense,
  doctorPhone,
}: SettingsFormProps) {
  const router = useRouter();

  const [previewUrl, setPreviewUrl] = useState<string | null>(clinicLogoUrl);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPreviewUrl(clinicLogoUrl);
  }, [clinicLogoUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      setPreviewUrl(clinicLogoUrl);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/settings", {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error || "No se pudo guardar la configuración");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Section title="Datos de la clínica">
        <Field label="Nombre de la clínica">
          <input name="name" defaultValue={clinicName} style={inputStyle} />
        </Field>

        <Field label="Logo de la clínica">
          <label style={uploadWrapper}>
            <input
              type="file"
              name="logo"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Logo preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 70,
                  objectFit: "contain",
                }}
              />
            ) : (
              <div style={uploadContent}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Subir imagen
                </div>

                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                  PNG o JPG recomendado
                </div>
              </div>
            )}
          </label>
        </Field>
      </Section>

      <Section title="Datos del médico para recetas">
        <div style={gridStyle}>
          <Field label="Nombre del médico">
            <input
              name="doctorName"
              defaultValue={doctorName ?? ""}
              style={inputStyle}
              placeholder="Ej. Dr. Adrian Hernández"
            />
          </Field>

          <Field label="Cédula profesional">
            <input
              name="doctorLicense"
              defaultValue={doctorLicense ?? ""}
              style={inputStyle}
              placeholder="Ej. 12345678"
            />
          </Field>

          <Field label="Teléfono de contacto">
            <input
              name="doctorPhone"
              defaultValue={doctorPhone ?? ""}
              style={inputStyle}
              placeholder="Ej. 33 1234 5678"
            />
          </Field>
        </div>

        <p style={helperText}>
          Estos datos se usarán automáticamente en las recetas médicas para que
          no tengas que capturarlos cada vez.
        </p>
      </Section>

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 22,
  marginBottom: 22,
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
  padding: "10px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 14,
};

const uploadWrapper: React.CSSProperties = {
  width: "100%",
  height: 120,
  border: "2px dashed #D1D5DB",
  borderRadius: 10,
  cursor: "pointer",
  background: "#F9FAFB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const uploadContent: React.CSSProperties = {
  textAlign: "center",
};

const helperText: React.CSSProperties = {
  fontSize: 13,
  color: "#6B7280",
  marginTop: -4,
  lineHeight: 1.6,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 4,
  background: "#2C6BED",
  color: "white",
  padding: "12px 18px",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};