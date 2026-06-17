"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [mobileViewEnabled, setMobileViewEnabled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedValue = window.localStorage.getItem("capiltrack-mobile-view");

    setMobileViewEnabled(savedValue === "enabled");

    function handleMobileViewChange(event: Event) {
      const customEvent = event as CustomEvent<{ enabled: boolean }>;

      setMobileViewEnabled(customEvent.detail.enabled);
      setIsMobileMenuOpen(false);
    }

    window.addEventListener(
      "capiltrack-mobile-view-change",
      handleMobileViewChange,
    );

    return () => {
      window.removeEventListener(
        "capiltrack-mobile-view-change",
        handleMobileViewChange,
      );
    };
  }, []);

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  const isAdmin = (session?.user as any)?.role === "SUPER_ADMIN";

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pacientes", href: "/patients" },
    { label: "Consultas", href: "/consultations" },
    { label: "Procedimientos", href: "/procedures" },
    { label: "Preguntas expediente", href: "/clinical-questions" },
    { label: "Configuración", href: "/settings" },
    ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  const activeItem =
    navItems.find((item) => isActive(item.href)) || navItems[0];

  const navItem = (path: string) => ({
    fontSize: 14,
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: 8,
    color: isActive(path) ? "#1D4ED8" : "#374151",
    background: isActive(path) ? "#EEF2FF" : "transparent",
    fontWeight: isActive(path) ? 600 : 400,
    transition: "all 0.15s ease",
  });

  if (mobileViewEnabled) {
    return (
      <aside className="app-sidebar-mobile-mode">
        <div className="app-sidebar-mobile-header">
          <button
            type="button"
            className="app-sidebar-mobile-menu-button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            ☰ Menú
          </button>

          <span className="app-sidebar-mobile-current">
            {activeItem.label}
          </span>
        </div>

        {isMobileMenuOpen && (
          <div className="app-sidebar-mobile-dropdown">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={navItem(item.href)}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-inner">
        <div className="app-sidebar-logo">
          <Image
            src="/capiltrack-logo-landscape.png"
            alt="CapilTrack"
            width={240}
            height={40}
            priority
          />
        </div>

        <nav className="app-sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={navItem(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}