    //app/api/patients/[id]/consultations/[consultationId]/prescriptions/[prescriptionId]/pdf/route.ts
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { renderToBuffer } from "@react-pdf/renderer";
import PrescriptionPdfDocument from "./PrescriptionPdfDocument";

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      consultationId: string;
      prescriptionId: string;
    }>;
  }
) {
  const { id, consultationId, prescriptionId } = await params;

  const { user } = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const prescription = await prisma.prescription.findFirst({
    where: {
      id: prescriptionId,
      patientId: id,
      consultationId,
      clinicId: user.clinicId,
    },
    include: {
      patient: true,
      consultation: true,
      items: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!prescription) {
    return new Response("Prescription not found", {
      status: 404,
    });
  }

  const clinic = await prisma.clinic.findUnique({
    where: {
      id: user.clinicId,
    },
    select: {
      name: true,
      logoUrl: true,
    },
  });

  if (!clinic) {
    return new Response("Clinic not found", {
      status: 404,
    });
  }

  const pdfBuffer = await renderToBuffer(
    <PrescriptionPdfDocument
      clinic={clinic}
      prescription={prescription}
    />
  );

  return new Response(pdfBuffer as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="receta-${prescriptionId}.pdf"`,
    },
  });
}