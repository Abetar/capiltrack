import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

type Params = Promise<{
  questionnaireId: string;
}>;

export async function POST(
  req: Request,
  { params }: { params: Params }
) {
  try {
    const { questionnaireId } = await params;

    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const questionText = body.questionText?.trim();

    if (!questionText) {
      return NextResponse.json(
        { error: "La pregunta es requerida" },
        { status: 400 }
      );
    }

    // 🔥 VALIDAR QUE EL CUESTIONARIO PERTENEZCA A LA CLÍNICA
    const questionnaire =
      await prisma.clinicalQuestionnaire.findFirst({
        where: {
          id: questionnaireId,
          clinicId: user.clinicId,
        },

        include: {
          questions: true,
        },
      });

    if (!questionnaire) {
      return NextResponse.json(
        { error: "Cuestionario no encontrado" },
        { status: 404 }
      );
    }

    // 🔥 OBTENER ÚLTIMO ORDEN
    const maxOrder =
      questionnaire.questions.length > 0
        ? Math.max(
            ...questionnaire.questions.map((q) => q.order)
          )
        : 0;

    // 🔥 CREAR PREGUNTA
    const question = await prisma.clinicalQuestion.create({
      data: {
        questionnaireId: questionnaire.id,
        questionText,
        order: maxOrder + 1,
      },
    });

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error) {
    console.error(
      "CREATE_CLINICAL_QUESTION_ERROR",
      error
    );

    return NextResponse.json(
      {
        error: "Error interno al crear pregunta",
      },
      { status: 500 }
    );
  }
}