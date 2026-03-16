"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

type Consultation = {
  id: string
  date: string
  norwoodLevel: number | null
  notes: string | null
}

export default function NewConsultationPage() {

  const router = useRouter()
  const params = useParams()

  const patientId = params?.id as string

  const today = new Date().toISOString().split("T")[0]

  const [date, setDate] = useState(today)
  const [norwoodLevel, setNorwoodLevel] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [history, setHistory] = useState<Consultation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {

    if (!patientId) return

    async function loadHistory() {

      try {

        const res = await fetch(`/api/patients/${patientId}/consultations`)

        if (!res.ok) {
          console.error("Error loading consultations")
          setLoadingHistory(false)
          return
        }

        const data = await res.json()

        setHistory(data.consultations || [])

      } catch (err) {
        console.error("Error loading history", err)
      }

      setLoadingHistory(false)
    }

    loadHistory()

  }, [patientId])


  async function submit(e: React.FormEvent) {

    e.preventDefault()

    setError("")
    setLoading(true)

    try {

      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          date,
          norwoodLevel: norwoodLevel ? Number(norwoodLevel) : null,
          notes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error creando consulta")
        setLoading(false)
        return
      }

      router.push(`/patients/${patientId}/consultations`)

    } catch (err) {

      console.error(err)
      setError("Error inesperado creando consulta")
      setLoading(false)

    }
  }

  return (
    <div
      style={{
        maxWidth: 900,
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 30
      }}
    >

      {/* FORMULARIO */}

      <div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          Nueva consulta
        </h1>

        <form
          onSubmit={submit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >

          {/* FECHA */}

          <div>
            <label style={{ fontSize: 14 }}>
              Fecha de consulta
            </label>

            <input
              type="date"
              className="ui-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* NORWOOD */}

          <select
            className="ui-input"
            value={norwoodLevel}
            onChange={(e) => setNorwoodLevel(e.target.value)}
          >
            <option value="">Nivel Norwood</option>
            <option value="1">Norwood I</option>
            <option value="2">Norwood II</option>
            <option value="3">Norwood III</option>
            <option value="4">Norwood IV</option>
            <option value="5">Norwood V</option>
            <option value="6">Norwood VI</option>
            <option value="7">Norwood VII</option>
          </select>

          {/* NOTAS */}

          <textarea
            className="ui-input"
            placeholder="Notas clínicas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {error && (
            <p style={{ color: "red" }}>{error}</p>
          )}

          <button
            className="ui-button"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar consulta"}
          </button>

        </form>

      </div>

      {/* HISTORIAL */}

      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 20,
          background: "white",
          height: "fit-content"
        }}
      >

        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 16
          }}
        >
          Historial de consultas
        </h3>

        {loadingHistory && (
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Cargando historial...
          </p>
        )}

        {!loadingHistory && history.length === 0 && (
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            No hay consultas registradas
          </p>
        )}

        {!loadingHistory && history.length > 0 && (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14
            }}
          >

            {history.map((c) => (

              <div
                key={c.id}
                style={{
                  borderBottom: "1px solid #E5E7EB",
                  paddingBottom: 10
                }}
              >

                <div
                  style={{
                    fontSize: 13,
                    color: "#6B7280"
                  }}
                >
                  {new Date(c.date).toLocaleDateString()}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  Norwood {c.norwoodLevel ?? "—"}
                </div>

                {c.notes && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      marginTop: 4
                    }}
                  >
                    {c.notes.length > 80
                      ? c.notes.slice(0,80) + "..."
                      : c.notes}
                  </div>
                )}

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  )
}