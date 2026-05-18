import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function ClinicalQuestionsPage() {
  const { user, reason } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (reason === "blocked") {
    return (
      <Container>
        <ErrorCard
          title="Cuenta bloqueada"
          description="Tu cuenta ha sido bloqueada. Contacta soporte."
        />
      </Container>
    );
  }

  if (reason === "no_subscription") {
    return (
      <Container>
        <ErrorCard
          title="Suscripción requerida"
          description="Necesitas una suscripción activa para usar esta sección."
        />
      </Container>
    );
  }

  const questionnaire = await prisma.clinicalQuestionnaire.findFirst({
    where: {
      clinicId: user.clinicId,
      isActive: true,
    },
    include: {
      questions: {
        where: {
          isActive: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  async function createQuestionnaire() {
    "use server";

    if (!user?.clinicId) {
      return;
    }

    const existing = await prisma.clinicalQuestionnaire.findFirst({
      where: {
        clinicId: user.clinicId,
        isActive: true,
      },
    });

    if (existing) {
      redirect(`/clinical-questions/${existing.id}`);
    }

    const created = await prisma.clinicalQuestionnaire.create({
      data: {
        clinicId: user.clinicId,
        title: "Expediente clínico inicial",
      },
    });

    redirect(`/clinical-questions/${created.id}`);
  }

  return (
    <Container>
      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            color: "#111827",
          }}
        >
          Preguntas expediente
        </h1>

        <p
          style={{
            color: "#6B7280",
            fontSize: 14,
            lineHeight: 1.6,
            maxWidth: 700,
          }}
        >
          Configura las preguntas que se utilizarán para construir el
          expediente clínico inicial de cada paciente.
        </p>
      </div>

      {/* NO QUESTIONNAIRE */}
      {!questionnaire && (
        <div style={emptyCard}>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 8,
                color: "#111827",
              }}
            >
              No hay cuestionario creado
            </h2>

            <p
              style={{
                fontSize: 14,
                color: "#6B7280",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              Crea el expediente clínico inicial que utilizarás para recopilar
              información importante de tus pacientes.
            </p>
          </div>

          <form action={createQuestionnaire}>
            <button style={primaryButton}>
              Crear cuestionario
            </button>
          </form>
        </div>
      )}

      {/* QUESTIONNAIRE */}
      {questionnaire && (
        <Link
          href={`/clinical-questions/${questionnaire.id}`}
          style={{
            textDecoration: "none",
          }}
        >
          <div style={questionnaireCard}>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div style={badge}>
                  Activo
                </div>

                <span
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                  }}
                >
                  1 cuestionario por clínica
                </span>
              </div>

              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 10,
                }}
              >
                {questionnaire.title}
              </h2>

              <p
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  marginBottom: 20,
                }}
              >
                {questionnaire.questions.length} preguntas activas
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {questionnaire.questions.slice(0, 5).map((question) => (
                  <div
                    key={question.id}
                    style={questionPreview}
                  >
                    <span
                      style={{
                        color: "#9CA3AF",
                        fontSize: 13,
                        minWidth: 22,
                      }}
                    >
                      {question.order}.
                    </span>

                    <span
                      style={{
                        fontSize: 14,
                        color: "#374151",
                      }}
                    >
                      {question.questionText}
                    </span>
                  </div>
                ))}

                {questionnaire.questions.length === 0 && (
                  <div
                    style={{
                      fontSize: 14,
                      color: "#9CA3AF",
                    }}
                  >
                    Aún no hay preguntas creadas.
                  </div>
                )}
              </div>
            </div>

            <div style={openButton}>
              Abrir cuestionario
            </div>
          </div>
        </Link>
      )}
    </Container>
  );
}

/* ========================= */
/* COMPONENTS */
/* ========================= */

function Container({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        maxWidth: 1000,
      }}
    >
      {children}
    </div>
  );
}

function ErrorCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 14,
        padding: 28,
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          color: "#6B7280",
          fontSize: 14,
        }}
      >
        {description}
      </p>
    </div>
  );
}

/* ========================= */
/* STYLES */
/* ========================= */

const emptyCard: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 16,
  padding: 32,
};

const questionnaireCard: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 16,
  padding: 28,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const badge: React.CSSProperties = {
  background: "#EEF2FF",
  color: "#1D4ED8",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const questionPreview: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 10,
  background: "#F9FAFB",
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

const openButton: React.CSSProperties = {
  background: "#2563EB",
  color: "white",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: "nowrap",
};