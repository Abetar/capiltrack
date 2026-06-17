"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  HiCalendarDays,
  HiClipboardDocumentList,
  HiClock,
  HiDocumentText,
} from "react-icons/hi2";

type Consultation = {
  id: string;
  date: string;
  norwoodLevel: number | null;
  notes: string | null;
};

export default function NewConsultationPage() {
  const router = useRouter();
  const params = useParams();

  const patientId = params?.id as string;

  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [norwoodLevel, setNorwoodLevel] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<Consultation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    async function loadHistory() {
      try {
        const res = await fetch(`/api/patients/${patientId}/consultations`);

        if (!res.ok) {
          console.error("Error loading consultations");
          setLoadingHistory(false);
          return;
        }

        const data = await res.json();

        setHistory(data.consultations || []);
      } catch (err) {
        console.error("Error loading history", err);
      }

      setLoadingHistory(false);
    }

    loadHistory();
  }, [patientId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

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
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error creando consulta");
        setLoading(false);
        return;
      }

      router.push(`/patients/${patientId}/consultations`);
    } catch (err) {
      console.error(err);
      setError("Error inesperado creando consulta");
      setLoading(false);
    }
  }

  return (
    <div className="new-consultation-page">
      <section className="new-consultation-main">
        <div className="new-consultation-header">
          <div className="new-consultation-icon">
            <HiClipboardDocumentList size={22} />
          </div>

          <div>
            <h1 className="new-consultation-title">Nueva consulta</h1>
            <p className="new-consultation-subtitle">
              Registra una nueva evaluación clínica del paciente.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="new-consultation-form">
          <div>
            <label className="new-consultation-label">
              Fecha de consulta
            </label>

            <div className="new-consultation-input-wrapper">
              <HiCalendarDays size={18} />

              <input
                type="date"
                className="ui-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="new-consultation-label">
              Nivel Norwood
            </label>

            <select
              className="ui-input"
              value={norwoodLevel}
              onChange={(e) => setNorwoodLevel(e.target.value)}
            >
              <option value="">Selecciona nivel Norwood</option>
              <option value="1">Norwood I</option>
              <option value="2">Norwood II</option>
              <option value="3">Norwood III</option>
              <option value="4">Norwood IV</option>
              <option value="5">Norwood V</option>
              <option value="6">Norwood VI</option>
              <option value="7">Norwood VII</option>
            </select>
          </div>

          <div>
            <label className="new-consultation-label">
              Notas clínicas
            </label>

            <div className="new-consultation-textarea-wrapper">
              <HiDocumentText size={18} />

              <textarea
                className="ui-input new-consultation-textarea"
                placeholder="Notas clínicas"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="new-consultation-error">{error}</p>}

          <button className="ui-button" disabled={loading}>
            {loading ? "Guardando..." : "Guardar consulta"}
          </button>
        </form>
      </section>

      <aside className="new-consultation-history-card">
        <div className="new-consultation-history-header">
          <HiClock size={18} />

          <h3>Historial de consultas</h3>
        </div>

        {loadingHistory && (
          <p className="new-consultation-muted">Cargando historial...</p>
        )}

        {!loadingHistory && history.length === 0 && (
          <p className="new-consultation-muted">
            No hay consultas registradas
          </p>
        )}

        {!loadingHistory && history.length > 0 && (
          <div className="new-consultation-history-list">
            {history.map((c) => (
              <div key={c.id} className="new-consultation-history-item">
                <div className="new-consultation-history-date">
                  {new Date(c.date).toLocaleDateString()}
                </div>

                <div className="new-consultation-history-norwood">
                  Norwood {c.norwoodLevel ?? "—"}
                </div>

                {c.notes && (
                  <div className="new-consultation-history-notes">
                    {c.notes.length > 80
                      ? c.notes.slice(0, 80) + "..."
                      : c.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}