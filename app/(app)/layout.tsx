// app/(app)/layout.tsx

import LogoutButton from "@/components/LogoutButton";
import AppSidebar from "@/components/AppSidebar";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { SessionProvider } from "next-auth/react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  // 🔥 OBTENER CLÍNICA
  const clinic = await prisma.clinic.findUnique({
    where: {
      id: (session.user as any).clinicId,
    },
    select: {
      name: true,
      logoUrl: true,
    },
  });

  return (
    <SessionProvider session={session}>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#F8FAFC",
        }}
      >
        {/* SIDEBAR */}
        <AppSidebar />

        {/* CONTENT AREA */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          <header
            style={{
              height: 60,
              background: "white",
              borderBottom: "1px solid #E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
            }}
          >
            {/* 🔥 BRAND DINÁMICO */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {clinic?.logoUrl ? (
                <img
                  src={clinic.logoUrl}
                  alt="Logo clínica"
                  style={{
                    height: 45,
                    objectFit: "contain",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#111827",
                  }}
                >
                  {clinic?.name || "Mi clínica"}
                </span>
              )}

              {/* Opcional: etiqueta */}
              <span
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                Panel
              </span>
            </div>

            <LogoutButton />
          </header>

          {/* PAGE CONTENT */}
          <main
            style={{
              flex: 1,
              padding: 40,
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}