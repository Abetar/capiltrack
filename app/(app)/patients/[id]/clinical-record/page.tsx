import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

import PatientClinicalRecordForm from "./PatientClinicalRecordForm";

export default async function PatientClinicalRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user, reason } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (reason === "blocked") {
    return (
      <ErrorCard
        title="Cuenta bloqueada"
        description="Tu cuenta ha sido bloqueada. Contacta soporte."
      />
    );
  }

  if (reason === "no_subscription") {
    return (
      <ErrorCard
        title="Suscripción requerida"
        description="Necesitas una suscripción activa para usar esta sección."
      />
    );
  }

  // 🔥 PACIENTE
  const patient = await prisma.patient.findFirst({
    where: {
      id,
      clinicId: user.clinicId,
    },

    include: {
      clinicalAnswers: true,
    },
  });

  if (!patient) {
    return (
      <ErrorCard
        title="Paciente no encontrado"
        description="No se encontró el paciente solicitado."
      />
    );
  }

  // 🔥 CUESTIONARIO
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

  if (!questionnaire) {
    return (
      <ErrorCard
        title="No hay cuestionario configurado"
        description="Primero debes crear un cuestionario de expediente clínico."
      />
    );
  }

  // 🔥 RESPUESTAS EXISTENTES
  const answersMap = new Map(
    patient.clinicalAnswers.map((a) => [a.questionId, a])
  );

  const formattedQuestions = questionnaire.questions.map((question) => ({
    id: question.id,
    questionText: question.questionText,
    order: question.order,
    existingAnswer:
      answersMap.get(question.id)?.answerText || "",
  }));

  return (
    <div
      style={{
        maxWidth: 1000,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          marginBottom: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
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
                marginBottom: 8,
              }}
            >
              Expediente clínico
            </h1>

            <p
              style={{
                fontSize: 15,
                color: "#6B7280",
                lineHeight: 1.7,
              }}
            >
              Completa la información clínica inicial del paciente.
            </p>
          </div>

          <div style={badge}>
            {formattedQuestions.length} preguntas
          </div>
        </div>

        {/* PATIENT CARD */}
        <div style={patientCard}>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              {patient.firstName} {patient.lastName ?? ""}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 18,
                fontSize: 14,
                color: "#6B7280",
              }}
            >
              {patient.gender && (
                <span>Género: {patient.gender}</span>
              )}

              {patient.birthDate && (
                <span>
                  Nacimiento:{" "}
                  {new Date(
                    patient.birthDate
                  ).toLocaleDateString()}
                </span>
              )}

              {patient.phone && (
                <span>Tel: {patient.phone}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FORM */}
      <PatientClinicalRecordForm
        patientId={patient.id}
        questions={formattedQuestions}
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
        maxWidth: 700,
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 30,
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 10,
          color: "#111827",
        }}
      >
        {title}
      </h1>

      <p
        style={{
          fontSize: 14,
          color: "#6B7280",
          lineHeight: 1.7,
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

const badge: React.CSSProperties = {
  background: "#EEF2FF",
  color: "#1D4ED8",
  borderRadius: 999,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
};

const patientCard: React.CSSProperties = {
  background: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 16,
  padding: 20,
};