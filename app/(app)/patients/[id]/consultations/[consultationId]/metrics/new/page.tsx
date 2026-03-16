"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function NewMetricPage() {
  const router = useRouter();
  const params = useParams();

  const patientId = params.id as string;
  const consultationId = params.consultationId as string;

  const [density, setDensity] = useState("");
  const [thickness, setThickness] = useState("");
  const [zone, setZone] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: any) {
    e.preventDefault();

    setLoading(true);

    const res = await fetch("/api/metrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        consultationId,
        density: density ? Number(density) : null,
        thickness: thickness ? Number(thickness) : null,
        zone: zone || null,
        notes: notes || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error guardando métricas");
      setLoading(false);
      return;
    }

    router.push(`/patients/${patientId}/consultations/${consultationId}`);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 600 }}>
          Registrar métricas capilares
        </h1>

        <button
          onClick={() =>
            router.push(`/patients/${patientId}/consultations/${consultationId}`)
          }
          style={{
            fontSize: 14,
            background: "transparent",
            border: "none",
            color: "#6B7280",
            cursor: "pointer",
          }}
        >
          ← Volver
        </button>
      </div>

      <form
        onSubmit={submit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* ZONA */}

        <select
          className="ui-input"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          <option value="">Zona</option>
          <option value="frontal">Frontal</option>
          <option value="crown">Coronilla</option>
          <option value="donor">Zona donante</option>
          <option value="left">Perfil izquierdo</option>
          <option value="right">Perfil derecho</option>
          <option value="top">Vista superior</option>
          <option value="macro">Macro</option>
        </select>

        {/* DENSIDAD */}

        <input
          className="ui-input"
          placeholder="Densidad (grafts/cm²)"
          value={density}
          onChange={(e) => setDensity(e.target.value)}
        />

        {/* GROSOR */}

        <input
          className="ui-input"
          placeholder="Grosor del cabello (µm)"
          value={thickness}
          onChange={(e) => setThickness(e.target.value)}
        />

        {/* NOTAS */}

        <textarea
          className="ui-input"
          placeholder="Notas clínicas"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button className="ui-button" disabled={loading}>
          {loading ? "Guardando..." : "Guardar métricas"}
        </button>
      </form>
    </div>
  );
}