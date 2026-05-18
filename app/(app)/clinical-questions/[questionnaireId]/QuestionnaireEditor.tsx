"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type QuestionItem = {
  id: string;
  questionText: string;
  order: number;
  isRequired: boolean;
  isActive: boolean;
  answersCount: number;
};

type Props = {
  questionnaireId: string;
  initialQuestions: QuestionItem[];
};

export default function QuestionnaireEditor({
  questionnaireId,
  initialQuestions,
}: Props) {
  const router = useRouter();

  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<QuestionItem | null>(null);

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => a.order - b.order);
  }, [questions]);

  function refresh() {
    router.refresh();
  }

  async function createQuestion() {
    if (!newQuestion.trim()) return;

    startTransition(async () => {
      const res = await fetch(
        `/api/clinical-questions/${questionnaireId}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionText: newQuestion,
          }),
        }
      );

      if (!res.ok) {
        alert("No se pudo crear la pregunta");
        return;
      }

      setNewQuestion("");
      refresh();
    });
  }

  async function moveQuestion(questionId: string, direction: "up" | "down") {
    startTransition(async () => {
      await fetch(`/api/clinical-questions/questions/${questionId}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction,
        }),
      });

      refresh();
    });
  }

  async function updateQuestion(questionId: string, questionText: string) {
    startTransition(async () => {
      await fetch(`/api/clinical-questions/questions/${questionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionText,
        }),
      });

      refresh();
    });
  }

  async function deleteQuestion(question: QuestionItem) {
    startTransition(async () => {
      await fetch(`/api/clinical-questions/questions/${question.id}`, {
        method: "DELETE",
      });

      setDeleteTarget(null);
      refresh();
    });
  }

  return (
    <>
      <div style={createCard}>
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 6,
              color: "#111827",
            }}
          >
            Nueva pregunta
          </h2>

          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Todas las preguntas serán respondidas mediante texto libre.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ej. ¿Es alérgico a algún medicamento?"
            style={inputStyle}
          />

          <button onClick={createQuestion} disabled={loading} style={primaryButton}>
            Agregar
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sortedQuestions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            total={sortedQuestions.length}
            onMove={moveQuestion}
            onSave={updateQuestion}
            onDelete={() => setDeleteTarget(question)}
          />
        ))}

        {sortedQuestions.length === 0 && (
          <div style={emptyCard}>Aún no hay preguntas creadas.</div>
        )}
      </div>

      {deleteTarget && (
        <div style={overlay}>
          <div style={modal}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 10,
                color: "#111827",
              }}
            >
              {deleteTarget.answersCount > 0
                ? "Desactivar pregunta"
                : "Eliminar pregunta"}
            </h2>

            <p
              style={{
                color: "#6B7280",
                fontSize: 14,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              {deleteTarget.answersCount > 0 ? (
                <>
                  Esta pregunta ya fue respondida por{" "}
                  <strong>{deleteTarget.answersCount} pacientes</strong>.
                  <br />
                  <br />
                  Se ocultará para nuevos expedientes, pero seguirá visible en
                  historiales clínicos y PDFs anteriores.
                </>
              ) : (
                <>
                  Esta pregunta no tiene respuestas y será eliminada
                  permanentemente.
                </>
              )}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <button onClick={() => setDeleteTarget(null)} style={secondaryButton}>
                Cancelar
              </button>

              <button
                onClick={() => deleteQuestion(deleteTarget)}
                style={dangerButton}
              >
                {deleteTarget.answersCount > 0 ? "Desactivar" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuestionCard({
  question,
  index,
  total,
  onMove,
  onSave,
  onDelete,
}: {
  question: QuestionItem;
  index: number;
  total: number;
  onMove: (questionId: string, direction: "up" | "down") => void;
  onSave: (questionId: string, questionText: string) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState(question.questionText);

  useEffect(() => {
    setValue(question.questionText);
  }, [question.questionText]);

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={orderBadge}>{question.order}</div>

        <div style={{ flex: 1 }}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
              const cleanValue = value.trim();

              if (cleanValue && cleanValue !== question.questionText) {
                onSave(question.id, cleanValue);
              }
            }}
            style={questionInput}
          />

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            {!question.isActive && <div style={inactiveBadge}>Desactivada</div>}

            {question.answersCount > 0 && (
              <div style={answersBadge}>
                {question.answersCount} respuestas
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            disabled={index === 0}
            onClick={() => onMove(question.id, "up")}
            style={{
              ...smallButton,
              opacity: index === 0 ? 0.4 : 1,
              cursor: index === 0 ? "not-allowed" : "pointer",
            }}
          >
            ↑
          </button>

          <button
            disabled={index === total - 1}
            onClick={() => onMove(question.id, "down")}
            style={{
              ...smallButton,
              opacity: index === total - 1 ? 0.4 : 1,
              cursor: index === total - 1 ? "not-allowed" : "pointer",
            }}
          >
            ↓
          </button>

          <button onClick={onDelete} style={deleteButton}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

const createCard: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 16,
  padding: 24,
  marginBottom: 24,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "1px solid #D1D5DB",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
};

const questionInput: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
};

const primaryButton: React.CSSProperties = {
  background: "#2563EB",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  background: "#F3F4F6",
  color: "#111827",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const dangerButton: React.CSSProperties = {
  background: "#DC2626",
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

const orderBadge: React.CSSProperties = {
  minWidth: 36,
  height: 36,
  borderRadius: 999,
  background: "#EEF2FF",
  color: "#1D4ED8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 14,
};

const smallButton: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  background: "white",
};

const deleteButton: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid #FCA5A5",
  background: "#FEF2F2",
  color: "#DC2626",
  cursor: "pointer",
};

const inactiveBadge: React.CSSProperties = {
  background: "#F3F4F6",
  color: "#6B7280",
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const answersBadge: React.CSSProperties = {
  background: "#ECFDF5",
  color: "#047857",
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 20,
};

const modal: React.CSSProperties = {
  width: "100%",
  maxWidth: 500,
  background: "white",
  borderRadius: 16,
  padding: 28,
  border: "1px solid #E5E7EB",
};