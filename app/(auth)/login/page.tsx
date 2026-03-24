"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Email o contraseña incorrectos")
      return
    }

    router.push("/dashboard")
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
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/capiltrack-logo-landscape.png"
            alt="CapilTrack"
            width={240}
            height={240}
            priority
          />
        </div>

        <p
          style={{
            color: "#6B7280",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          Iniciar sesión en la clínica
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
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* INPUT EMAIL */}
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

          {/* INPUT PASSWORD */}
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
            }}
          />

          {/* BOTÓN */}
          <button
            type="submit"
            style={{
              background: "#2C6BED",
              color: "white",
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* LINKS */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 14,
            textAlign: "center",
          }}
        >
          <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
          <a href="/register">Crear cuenta</a>
        </div>
      </div>
    </div>
  )
}