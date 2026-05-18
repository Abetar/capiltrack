import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

type Params = Promise<{
  questionId: string;
}>;

export async function POST(
  req: Request,
  { params }: { params: Params }
) {
  try {
    const { questionId } = await params;

    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const direction = body.direction as
      | "up"
      | "down";

    if (
      direction !== "up" &&
      direction !== "down"
    ) {
      return NextResponse.json(
        {
          error: "Dirección inválida",
        },
        { status: 400 }
      );
    }

    // 🔥 OBTENER PREGUNTA ACTUAL
    const currentQuestion =
      await prisma.clinicalQuestion.findFirst({
        where: {
          id: questionId,

          questionnaire: {
            clinicId: user.clinicId,
          },
        },
      });

    if (!currentQuestion) {
      return NextResponse.json(
        {
          error: "Pregunta no encontrada",
        },
        { status: 404 }
      );
    }

    // 🔥 BUSCAR PREGUNTA A INTERCAMBIAR
    const targetQuestion =
      await prisma.clinicalQuestion.findFirst({
        where: {
          questionnaireId:
            currentQuestion.questionnaireId,

          order:
            direction === "up"
              ? currentQuestion.order - 1
              : currentQuestion.order + 1,
        },
      });

    // 🔥 SI NO EXISTE (TOP/BOTTOM)
    if (!targetQuestion) {
      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    // 🔥 SWAP DE ORDEN
    await prisma.$transaction([
      prisma.clinicalQuestion.update({
        where: {
          id: currentQuestion.id,
        },

        data: {
          order: targetQuestion.order,
        },
      }),

      prisma.clinicalQuestion.update({
        where: {
          id: targetQuestion.id,
        },

        data: {
          order: currentQuestion.order,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "MOVE_CLINICAL_QUESTION_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno al mover pregunta",
      },
      { status: 500 }
    );
  }
}