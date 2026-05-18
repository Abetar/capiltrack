"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  questionText: string;
  order: number;
  existingAnswer: string;
};

type Props = {
  patientId: string;
  questions: Question[];
};

export default function PatientClinicalRecordForm({
  patientId,
  questions,
}: Props) {
  const router = useRouter();

  const [loading, startTransition] = useTransition();

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};

    questions.forEach((q) => {
      initial[q.id] = q.existingAnswer || "";
    });

    return initial;
  });

  async function handleSubmit() {
    startTransition(async () => {
      const res = await fetch(
        `/api/patients/${patientId}/clinical-record`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            answers,
          }),
        }
      );

      if (!res.ok) {
        alert("No se pudo guardar el expediente clínico");
        return;
      }

      router.refresh();

      alert("Expediente clínico guardado correctamente");
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* QUESTIONS */}
      {questions.map((question) => (
        <div
          key={question.id}
          style={cardStyle}
        >
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={orderBadge}>
              {question.order}
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#111827",
                lineHeight: 1.6,
              }}
            >
              {question.questionText}
            </div>
          </div>

          <textarea
            value={answers[question.id] || ""}
            onChange={(e) =>
              setAnswers((prev) => ({
                ...prev,
                [question.id]: e.target.value,
              }))
            }
            placeholder="Escribe la respuesta del paciente..."
            style={textareaStyle}
          />
        </div>
      ))}

      {/* EMPTY */}
      {questions.length === 0 && (
        <div style={emptyCard}>
          No hay preguntas configuradas.
        </div>
      )}

      {/* ACTIONS */}
      {questions.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 10,
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={saveButton}
          >
            {loading
              ? "Guardando..."
              : "Guardar expediente clínico"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ========================= */
/* STYLES */
/* ========================= */

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 16,
  padding: 22,
};

const orderBadge: React.CSSProperties = {
  minWidth: 34,
  height: 34,
  borderRadius: 999,
  background: "#EEF2FF",
  color: "#1D4ED8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 120,
  resize: "vertical",
  border: "1px solid #D1D5DB",
  borderRadius: 12,
  padding: "14px 16px",
  fontSize: 14,
  lineHeight: 1.7,
  outline: "none",
  color: "#111827",
};

const saveButton: React.CSSProperties = {
  background: "#2563EB",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const emptyCard: React.CSSProperties = {
  background: "white",
  border: "1px dashed #D1D5DB",
  borderRadius: 16,
  padding: 30,
  textAlign: "center",
  color: "#9CA3AF",
  fontSize: 14,
};