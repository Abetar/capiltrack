// app/(app)/layout.tsx

import LogoutButton from "@/components/LogoutButton";
import AppSidebar from "@/components/AppSidebar";
import { auth } from "@/lib/auth/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
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
            fontSize: 14,
            color: "#374151",
          }}
        >
          <span>Panel de clínica</span>

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
  );
}