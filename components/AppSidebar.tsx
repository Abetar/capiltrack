"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  const navItem = (path: string) => ({
    fontSize: 14,
    textDecoration: "none",
    padding: "8px 10px",
    borderRadius: 6,
    color: isActive(path) ? "#1D4ED8" : "#374151",
    background: isActive(path) ? "#EEF2FF" : "transparent",
    fontWeight: isActive(path) ? 600 : 400,
  });

  // 🔥 SUPER ADMIN
  const isAdmin = (session?.user as any)?.role === "SUPER_ADMIN";

  return (
    <aside
      style={{
        width: 240,
        background: "white",
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ padding: "24px 20px" }}>
        <div style={{ marginBottom: 30 }}>
          <Image
            src="/capiltrack-logo-2.png"
            alt="CapilTrack"
            width={160}
            height={40}
            priority
          />
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Link href="/dashboard" style={navItem("/dashboard")}>
            Dashboard
          </Link>

          <Link href="/patients" style={navItem("/patients")}>
            Pacientes
          </Link>

          <Link href="/consultations" style={navItem("/consultations")}>
            Consultas
          </Link>

          <Link href="/procedures" style={navItem("/procedures")}>
            Procedimientos
          </Link>

          {/* 🔥 ADMIN SOLO PARA TI */}
          {isAdmin && (
            <Link href="/admin" style={navItem("/admin")}>
              Admin
            </Link>
          )}
        </nav>
      </div>
    </aside>
  );
}