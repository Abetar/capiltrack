"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import imageCompression from "browser-image-compression";

export default function NewPhotoPage() {
  const router = useRouter();
  const params = useParams();

  const patientId = params.id as string;
  const consultationId = params.consultationId as string;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [zone, setZone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(f: File) {
    try {
      const options = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(f, options);

      setFile(compressedFile);

      const reader = new FileReader();

      reader.onload = () => {
        setPreview(reader.result as string);
      };

      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error(err);
    }
  }

  function onDrop(e: any) {
    e.preventDefault();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  }

  async function submit(e: any) {
    e.preventDefault();

    if (!file) {
      setError("Selecciona una imagen");
      return;
    }

    if (!zone) {
      setError("Selecciona la zona capilar");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error("Error subiendo imagen");
      }

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          consultationId,
          url: uploadData.url,
          zone,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      router.push(`/patients/${patientId}/consultations/${consultationId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 600,
          marginBottom: 20,
        }}
      >
        Agregar foto clínica
      </h1>

      <form
        onSubmit={submit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* DROP ZONE */}

        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => document.getElementById("fileInput")?.click()}
          style={{
            border: dragActive
              ? "2px solid #2C6BED"
              : "2px dashed #D1D5DB",
            borderRadius: 12,
            padding: 30,
            textAlign: "center",
            cursor: "pointer",
            background: dragActive ? "#F0F6FF" : "#FAFAFA",
            transition: "all 0.2s ease",
          }}
        >
          {!preview && (
            <>
              <div style={{ fontSize: 34 }}>📷</div>

              <p style={{ marginTop: 10, fontWeight: 500 }}>
                Arrastra una imagen aquí
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                o haz click para seleccionar
              </p>
            </>
          )}

          {preview && (
            <div>
              <img
                src={preview}
                style={{
                  width: "100%",
                  borderRadius: 10,
                }}
              />

              <p
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                Click para cambiar imagen
              </p>
            </div>
          )}
        </div>

        <input
          id="fileInput"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];

            if (f) {
              handleFile(f);
            }
          }}
        />

        {/* ZONA */}

        <select
          className="ui-input"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          <option value="">Selecciona zona capilar</option>
          <option value="frontal">Frontal</option>
          <option value="crown">Crown (coronilla)</option>
          <option value="donor">Zona donante</option>
          <option value="left">Perfil izquierdo</option>
          <option value="right">Perfil derecho</option>
          <option value="top">Vista superior</option>
          <option value="macro">Macro / detalle</option>
        </select>

        {/* NOTAS */}

        <textarea
          className="ui-input"
          placeholder="Notas clínicas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && (
          <p
            style={{
              color: "#B91C1C",
              fontSize: 14,
            }}
          >
            {error}
          </p>
        )}

        <button
          className="ui-button"
          disabled={loading}
          style={{
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Subiendo foto..." : "Guardar foto"}
        </button>
      </form>
    </div>
  );
}
