"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        background: "#EF4444",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "#DC2626")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "#EF4444")
      }
    >
      Cerrar sesión
    </button>
  );
}