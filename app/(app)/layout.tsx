// app/(app)/layout.tsx

import LogoutButton from "@/components/LogoutButton";
import AppSidebar from "@/components/AppSidebar";
import MobileViewShell from "@/components/layout/MobileViewShell";
import MobileViewToggleButton from "@/components/layout/MobileViewToggleButton";
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
      <MobileViewShell>
        <div
          className="capiltrack-layout-root"
          style={{
            display: "flex",
            minHeight: "100vh",
            background: "#F8FAFC",
          }}
        >
          
          <AppSidebar />

          <div
            className="capiltrack-content-area"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <header
              className="capiltrack-app-header"
              style={{
                height: 60,
                background: "white",
                borderBottom: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                gap: 16,
              }}
            >
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

                <span
                  style={{
                    fontSize: 12,
                    color: "#6B7280",
                  }}
                >
                  Panel
                </span>
              </div>

              <div
                className="capiltrack-header-actions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <MobileViewToggleButton />
                <LogoutButton />
              </div>
            </header>

            <main
              className="capiltrack-page-content"
              style={{
                flex: 1,
                padding: 40,
              }}
            >
              {children}
            </main>
          </div>
        </div>
      </MobileViewShell>
    </SessionProvider>
  );
}