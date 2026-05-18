import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

type Params = Promise<{
  questionId: string;
}>;

/* ========================= */
/* UPDATE QUESTION */
/* ========================= */

export async function PATCH(
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

    const questionText = body.questionText?.trim();

    if (!questionText) {
      return NextResponse.json(
        { error: "La pregunta es requerida" },
        { status: 400 }
      );
    }

    // 🔥 VALIDAR ACCESO
    const question =
      await prisma.clinicalQuestion.findFirst({
        where: {
          id: questionId,

          questionnaire: {
            clinicId: user.clinicId,
          },
        },
      });

    if (!question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    // 🔥 UPDATE
    const updated =
      await prisma.clinicalQuestion.update({
        where: {
          id: question.id,
        },

        data: {
          questionText,
        },
      });

    return NextResponse.json({
      success: true,
      question: updated,
    });
  } catch (error) {
    console.error(
      "UPDATE_CLINICAL_QUESTION_ERROR",
      error
    );

    return NextResponse.json(
      {
        error: "Error interno al actualizar pregunta",
      },
      { status: 500 }
    );
  }
}

/* ========================= */
/* DELETE / DEACTIVATE */
/* ========================= */

export async function DELETE(
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

    // 🔥 VALIDAR ACCESO + RESPUESTAS
    const question =
      await prisma.clinicalQuestion.findFirst({
        where: {
          id: questionId,

          questionnaire: {
            clinicId: user.clinicId,
          },
        },

        include: {
          _count: {
            select: {
              answers: true,
            },
          },
        },
      });

    if (!question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    // 🔥 SI YA TIENE RESPUESTAS → DESACTIVAR
    if (question._count.answers > 0) {
      const updated =
        await prisma.clinicalQuestion.update({
          where: {
            id: question.id,
          },

          data: {
            isActive: false,
          },
        });

      return NextResponse.json({
        success: true,
        mode: "deactivated",
        question: updated,
      });
    }

    // 🔥 SI NO TIENE RESPUESTAS → BORRAR
    await prisma.clinicalQuestion.delete({
      where: {
        id: question.id,
      },
    });

    return NextResponse.json({
      success: true,
      mode: "deleted",
    });
  } catch (error) {
    console.error(
      "DELETE_CLINICAL_QUESTION_ERROR",
      error
    );

    return NextResponse.json(
      {
        error: "Error interno al eliminar pregunta",
      },
      { status: 500 }
    );
  }
}