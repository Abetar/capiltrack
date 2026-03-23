"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";

export default function ResetPasswordClient() {
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setResetUrl("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Ocurrió un error");
      return;
    }

    setResetUrl(data.resetUrl);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8FAFC",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>
          Recuperar contraseña
        </h1>

        <p style={{ fontSize: 14, color: "#6B7280" }}>
          Ingresa tu correo para generar un enlace de recuperación
        </p>

        {/* ERROR ALERT */}
        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              color: "#B91C1C",
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* INPUT NATIVO (evitamos tu Input roto) */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
            }}
          />

          <Button type="submit">
            {loading ? "Validando..." : "Generar enlace"}
          </Button>
        </form>

        {/* SUCCESS */}
        {resetUrl && (
          <div
            style={{
              background: "#ECFDF5",
              border: "1px solid #6EE7B7",
              color: "#047857",
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            Enlace generado correctamente
            <div style={{ marginTop: 10 }}>
              <a href={resetUrl}>
                <Button type="button">
                  Ir a reset password
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}