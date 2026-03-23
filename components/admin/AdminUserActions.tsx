"use client";

export default function AdminUserActions({
  userId,
  isBlocked,
}: {
  userId: string;
  isBlocked: boolean;
}) {
  async function handleAction(action: "block" | "unblock") {
    await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetUserId: userId,
        action,
      }),
    });

    // 🔥 recargar
    window.location.reload();
  }

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
      {!isBlocked ? (
        <button
          onClick={() => handleAction("block")}
          style={{
            background: "#B91C1C",
            color: "white",
            border: "none",
            padding: "6px 10px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Bloquear
        </button>
      ) : (
        <button
          onClick={() => handleAction("unblock")}
          style={{
            background: "#16A34A",
            color: "white",
            border: "none",
            padding: "6px 10px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Desbloquear
        </button>
      )}
      <button
        onClick={async () => {
          const confirmDelete = confirm(
            "¿Seguro que quieres eliminar este usuario?",
          );

          if (!confirmDelete) return;

          await fetch("/api/admin/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              targetUserId: userId,
              action: "delete",
            }),
          });

          window.location.reload();
        }}
        style={{
          background: "#111827",
          color: "white",
          border: "none",
          padding: "6px 10px",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Eliminar
      </button>
    </div>
  );
}
