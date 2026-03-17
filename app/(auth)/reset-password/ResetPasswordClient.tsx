"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    if (!token) {
      setError("Token inválido.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Ocurrió un error.");
      return;
    }

    setSuccess("Contraseña actualizada correctamente.");

    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
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
        Nueva contraseña
      </h1>

      <Input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e: any) => setPassword(e.target.value)}
      />

      <Button type="submit">
        {loading ? "Guardando..." : "Guardar contraseña"}
      </Button>

      {error && <p style={{ color: "#DC2626" }}>{error}</p>}
      {success && <p style={{ color: "#16A34A" }}>{success}</p>}
    </form>
  );
}