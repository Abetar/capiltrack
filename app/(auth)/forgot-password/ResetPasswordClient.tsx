"use client";

import { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ResetPasswordClient() {
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 Esto evita el prerender conflictivo de Next 16
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
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>
        Recuperar contraseña
      </h1>

      <p style={{ fontSize: 14, color: "#6B7280" }}>
        Ingresa tu correo para generar un enlace de recuperación
      </p>

      <Input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Button type="submit">
        {loading ? "Validando..." : "Generar enlace"}
      </Button>

      {error && (
        <p style={{ color: "#DC2626", fontSize: 13 }}>
          {error}
        </p>
      )}

      {resetUrl && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 13, marginBottom: 8 }}>
            Enlace generado:
          </p>

          <a href={resetUrl}>
            <Button type="button">
              Ir a reset password
            </Button>
          </a>
        </div>
      )}
    </form>
  );
}