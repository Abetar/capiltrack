import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const doctorName = formData.get("doctorName") as string;
    const doctorLicense = formData.get("doctorLicense") as string;
    const doctorPhone = formData.get("doctorPhone") as string;

    const file = formData.get("logo") as File | null;

    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clínica no encontrada" },
        { status: 404 }
      );
    }

    let logoUrl = clinic.logoUrl;

    if (file && file.size > 0) {
      const cloudinaryForm = new FormData();

      cloudinaryForm.append("file", file);
      cloudinaryForm.append("upload_preset", "nomadisch_unsigned");

      const cloudinaryRes = await fetch(
        "https://api.cloudinary.com/v1_1/dslzzoqjy/image/upload",
        {
          method: "POST",
          body: cloudinaryForm,
        }
      );

      const cloudinaryData = await cloudinaryRes.json();

      if (!cloudinaryRes.ok || !cloudinaryData.secure_url) {
        return NextResponse.json(
          {
            error: "Error al subir imagen a Cloudinary",
            details: cloudinaryData,
          },
          { status: 400 }
        );
      }

      logoUrl = cloudinaryData.secure_url;
    }

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: {
        name: name?.trim() || clinic.name,
        logoUrl,
        doctorName: doctorName?.trim() || null,
        doctorLicense: doctorLicense?.trim() || null,
        doctorPhone: doctorPhone?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, logoUrl });
  } catch (error) {
    console.error("SETTINGS_ERROR", error);

    return NextResponse.json(
      { error: "Error interno al guardar configuración" },
      { status: 500 }
    );
  }
}