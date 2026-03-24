import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const { user, reason } = await getCurrentUser();

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          padding: 20,
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 32,
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
            Acceso restringido
          </h2>

          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
            {reason === "no_subscription" &&
              "Tu suscripción ha expirado o no está activa. Para continuar usando CapilTrack, necesitas renovar tu acceso."}
            {reason === "blocked" &&
              "Tu cuenta ha sido bloqueada. Contacta al administrador para más información."}
            {reason === "not_authenticated" &&
              "Debes iniciar sesión para acceder."}
          </p>

          {reason === "no_subscription" && (
            <a href="/api/stripe/checkout">
              <button style={buttonStyle}>Reactivar suscripción</button>
            </a>
          )}
        </div>
      </div>
    );
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
  });

  if (!clinic) {
    return <div>Clínica no encontrada</div>;
  }

  const c = clinic;

  async function updateSettings(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const file = formData.get("logo") as File | null;

    let logoUrl = c.logoUrl;

    if (file && file.size > 0) {
      const cloudinaryForm = new FormData();

      // ✔ Enviar archivo directo
      cloudinaryForm.append("file", file);

      // ⚠️ IMPORTANTE: este preset debe ser unsigned en Cloudinary
      cloudinaryForm.append("upload_preset", "nomadisch_unsigned");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dslzzoqjy/image/upload",
        {
          method: "POST",
          body: cloudinaryForm,
        }
      );

      const data = await res.json();

      console.log("CLOUDINARY RESPONSE:", data);

      if (!res.ok || !data.secure_url) {
        // 🔥 Ahora verás el error real en pantalla
        throw new Error("Cloudinary error: " + JSON.stringify(data));
      }

      logoUrl = data.secure_url;
    }

    await prisma.clinic.update({
      where: { id: c.id },
      data: {
        name: name || c.name,
        logoUrl: logoUrl || null,
      },
    });

    revalidatePath("/settings");
    redirect("/settings");
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>
        Configuración
      </h1>

      <SettingsForm
        clinicName={c.name}
        clinicLogoUrl={c.logoUrl}
        action={updateSettings}
      />
    </div>
  );
}

const buttonStyle = {
  marginTop: 20,
  background: "#2C6BED",
  color: "white",
  padding: "12px 18px",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};