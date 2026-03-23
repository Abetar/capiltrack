import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import AdminUserActions from "@/components/admin/AdminUserActions";

export default async function AdminPage() {
  const { user } = await getCurrentUser();

  // 🔒 SEGURIDAD REAL
  if (!user || user.role !== "SUPER_ADMIN") {
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

          <p style={{ fontSize: 14, color: "#6B7280" }}>
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  // 🔥 TRAER TODOS LOS USUARIOS
  const users = await prisma.user.findMany({
    include: {
      clinic: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>
        Panel de Administración
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {users.map((u) => (
          <div
            key={u.id}
            style={{
              border: "1px solid #E5E7EB",
              padding: 16,
              borderRadius: 8,
              background: "white",
            }}
          >
            <div style={{ fontWeight: 600 }}>{u.email}</div>

            <div style={{ fontSize: 13, color: "#6B7280" }}>
              Clínica: {u.clinic.name}
            </div>

            <div style={{ fontSize: 13 }}>
              Estado:{" "}
              <strong>
                {u.subscriptionStatus} |{" "}
                {u.isBlocked ? "Bloqueado" : "Activo"}
              </strong>
            </div>

            {/* 🔥 ACCIONES ADMIN */}
            <AdminUserActions
              userId={u.id}
              isBlocked={u.isBlocked}
            />
          </div>
        ))}
      </div>
    </div>
  );
}