"use client";

import { useEffect, useState } from "react";

type SettingsFormProps = {
  clinicName: string;
  clinicLogoUrl: string | null;
  action: (formData: FormData) => void | Promise<void>;
};

export default function SettingsForm({
  clinicName,
  clinicLogoUrl,
  action,
}: SettingsFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(clinicLogoUrl);

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

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form action={action}>
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

              <div
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  marginTop: 4,
                }}
              >
                PNG o JPG recomendado
              </div>
            </div>
          )}
        </label>
      </Field>

      <button style={buttonStyle}>Guardar cambios</button>
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