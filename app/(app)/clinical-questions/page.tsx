// app/(app)/clinical-questions/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  HiClipboardDocumentList,
  HiPlus,
  HiArrowRight,
  HiCheckCircle,
} from "react-icons/hi2";

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
      <div className="clinical-questions-header">
        <div className="clinical-questions-header-icon">
          <HiClipboardDocumentList size={24} />
        </div>

        <div>
          <h1 className="clinical-questions-title">Preguntas expediente</h1>

          <p className="clinical-questions-subtitle">
            Configura las preguntas que se utilizarán para construir el
            expediente clínico inicial de cada paciente.
          </p>
        </div>
      </div>

      {!questionnaire && (
        <div className="clinical-questions-empty-card">
          <div>
            <h2 className="clinical-questions-card-title">
              No hay cuestionario creado
            </h2>

            <p className="clinical-questions-card-description">
              Crea el expediente clínico inicial que utilizarás para recopilar
              información importante de tus pacientes.
            </p>
          </div>

          <form action={createQuestionnaire}>
            <button className="clinical-questions-primary-button">
              <HiPlus size={18} />
              <span>Crear cuestionario</span>
            </button>
          </form>
        </div>
      )}

      {questionnaire && (
        <Link
          href={`/clinical-questions/${questionnaire.id}`}
          className="clinical-questions-card-link"
        >
          <div className="clinical-questions-questionnaire-card">
            <div className="clinical-questions-card-content">
              <div className="clinical-questions-card-meta">
                <div className="clinical-questions-badge">
                  <HiCheckCircle size={15} />
                  <span>Activo</span>
                </div>

                <span className="clinical-questions-card-note">
                  1 cuestionario por clínica
                </span>
              </div>

              <h2 className="clinical-questions-card-title">
                {questionnaire.title}
              </h2>

              <p className="clinical-questions-card-description">
                {questionnaire.questions.length} preguntas activas
              </p>

              <div className="clinical-questions-preview-list">
                {questionnaire.questions.slice(0, 5).map((question) => (
                  <div
                    key={question.id}
                    className="clinical-questions-preview-item"
                  >
                    <span className="clinical-questions-preview-order">
                      {question.order}.
                    </span>

                    <span className="clinical-questions-preview-text">
                      {question.questionText}
                    </span>
                  </div>
                ))}

                {questionnaire.questions.length === 0 && (
                  <div className="clinical-questions-empty-text">
                    Aún no hay preguntas creadas.
                  </div>
                )}
              </div>
            </div>

            <div className="clinical-questions-open-button">
              <span>Abrir cuestionario</span>
              <HiArrowRight size={18} />
            </div>
          </div>
        </Link>
      )}
    </Container>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="clinical-questions-container">{children}</div>;
}

function ErrorCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="clinical-questions-error-card">
      <h2 className="clinical-questions-card-title">{title}</h2>

      <p className="clinical-questions-card-description">{description}</p>
    </div>
  );
}