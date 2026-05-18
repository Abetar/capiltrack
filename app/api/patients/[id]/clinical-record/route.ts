import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

type Params = Promise<{
  id: string;
}>;

export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const { id: patientId } = await params;

    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const answers = body.answers as Record<string, string>;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Respuestas inválidas" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        clinicId: user.clinicId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const questionIds = Object.keys(answers);

    const questions = await prisma.clinicalQuestion.findMany({
      where: {
        id: {
          in: questionIds,
        },
        isActive: true,
        questionnaire: {
          clinicId: user.clinicId,
          isActive: true,
        },
      },
    });

    await prisma.$transaction(
      questions.map((question) =>
        prisma.patientClinicalAnswer.upsert({
          where: {
            patientId_questionId: {
              patientId: patient.id,
              questionId: question.id,
            },
          },
          update: {
            answerText: answers[question.id]?.trim() || null,
            questionTextSnapshot: question.questionText,
          },
          create: {
            clinicId: user.clinicId,
            patientId: patient.id,
            questionId: question.id,
            questionTextSnapshot: question.questionText,
            answerText: answers[question.id]?.trim() || null,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("SAVE_PATIENT_CLINICAL_RECORD_ERROR", error);

    return NextResponse.json(
      { error: "Error interno al guardar expediente clínico" },
      { status: 500 }
    );
  }
}