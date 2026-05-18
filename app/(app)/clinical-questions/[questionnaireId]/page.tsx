import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

import QuestionnaireEditor from "./QuestionnaireEditor";

type PageProps = {
  params: Promise<{
    questionnaireId: string;
  }>;
};

export default async function QuestionnairePage({
  params,
}: PageProps) {
  const { questionnaireId } = await params;

  const { user, reason } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (reason === "blocked") {
    return (
      <div style={errorContainer}>
        <ErrorCard
          title="Cuenta bloqueada"
          description="Tu cuenta ha sido bloqueada. Contacta soporte."
        />
      </div>
    );
  }

  if (reason === "no_subscription") {
    return (
      <div style={errorContainer}>
        <ErrorCard
          title="Suscripción requerida"
          description="Necesitas una suscripción activa para usar esta sección."
        />
      </div>
    );
  }

  const questionnaire = await prisma.clinicalQuestionnaire.findFirst({
    where: {
      id: questionnaireId,
      clinicId: user.clinicId,
    },

    include: {
      questions: {
        include: {
          _count: {
            select: {
              answers: true,
            },
          },
        },

        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!questionnaire) {
    return (
      <div style={errorContainer}>
        <ErrorCard
          title="Cuestionario no encontrado"
          description="No existe este cuestionario o no pertenece a tu clínica."
        />
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1100,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              {questionnaire.title}
            </h1>

            <p
              style={{
                fontSize: 14,
                color: "#6B7280",
                lineHeight: 1.6,
              }}
            >
              Configura las preguntas del expediente clínico inicial.
            </p>
          </div>

          <div style={badge}>
            {questionnaire.questions.filter((q) => q.isActive).length} activas
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#9CA3AF",
          }}
        >
          Las preguntas desactivadas seguirán visibles en expedientes históricos
          y PDFs ya generados.
        </div>
      </div>

      {/* EDITOR */}
      <QuestionnaireEditor
        questionnaireId={questionnaire.id}
        initialQuestions={questionnaire.questions.map((question) => ({
          id: question.id,
          questionText: question.questionText,
          order: question.order,
          isRequired: question.isRequired,
          isActive: question.isActive,
          answersCount: question._count.answers,
        }))}
      />
    </div>
  );
}

/* ========================= */
/* COMPONENTS */
/* ========================= */

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
        maxWidth: 500,
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
          lineHeight: 1.6,
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

const errorContainer: React.CSSProperties = {
  maxWidth: 900,
};

const badge: React.CSSProperties = {
  background: "#EEF2FF",
  color: "#1D4ED8",
  borderRadius: 999,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
};