import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { renderToBuffer } from "@react-pdf/renderer";
import PatientPdfDocument from "./PatientPdfDocument";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { user } = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id,
      clinicId: user.clinicId,
    },
    include: {
      consultations: {
        include: {
          metrics: true,
        },
        orderBy: {
          date: "desc",
        },
      },
      transplants: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  const clinic = await prisma.clinic.findUnique({
    where: {
      id: user.clinicId,
    },
    select: {
      name: true,
      logoUrl: true,
    },
  });

  if (!patient || !clinic) {
    return new Response("Not found", { status: 404 });
  }

  const pdfBuffer = await renderToBuffer(
    <PatientPdfDocument clinic={clinic} patient={patient} />
  );

  return new Response(pdfBuffer as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="paciente-${id}.pdf"`,
    },
  });
}