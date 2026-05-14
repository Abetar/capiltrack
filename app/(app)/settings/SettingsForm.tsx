"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SettingsFormProps = {
  clinicName: string;
  clinicLogoUrl: string | null;
};

export default function SettingsForm({
  clinicName,
  clinicLogoUrl,
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

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
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

const uploadWrapper = {
  width: "100%",
  height: 120,
  border: "2px dashed #D1D5DB",
  borderRadius: 10,
  cursor: "pointer",
  background: "#F9FAFB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden" as const,
};

const uploadContent = {
  textAlign: "center" as const,
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