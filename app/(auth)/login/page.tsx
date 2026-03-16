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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Email o contraseña incorrectos")
      return
    }

    router.push("/dashboard")
  }

  return (
    <>
      {/* Logo */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Image
          src="/capiltrack-logo-2.png"
          alt="CapilTrack"
          width={160}
          height={160}
          priority
        />
      </div>

      <p
        style={{
          color: "#6B7280",
          marginBottom: 28,
          fontSize: 14,
          textAlign: "center",
        }}
      >
        Iniciar sesión en la clínica
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <input
          className="ui-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="ui-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div
            style={{
              color: "#B91C1C",
              fontSize: 14,
              background: "#FEE2E2",
              padding: "10px 12px",
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}

        <button className="ui-button">
          Entrar
        </button>
      </form>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: 14,
          textAlign: "center",
        }}
      >
        <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
        <a href="/register">Crear cuenta</a>
      </div>
    </>
  )
}
