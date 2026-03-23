"use client";

export default function AdminUserActions({
  userId,
  isBlocked,
  hasSubscription,
}: {
  userId: string;
  isBlocked: boolean;
  hasSubscription: boolean;
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

    window.location.reload();
  }

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
      
      {/* 🔥 BLOQUEO */}
      {!isBlocked ? (
        <button onClick={() => handleAction("block")} style={btnRed}>
          Bloquear
        </button>
      ) : (
        <button onClick={() => handleAction("unblock")} style={btnGreen}>
          Desbloquear
        </button>
      )}

      {/* 🔥 ELIMINAR */}
      <button
        onClick={async () => {
          if (!confirm("¿Seguro que quieres eliminar este usuario?")) return;

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
        style={btnDark}
      >
        Eliminar
      </button>

      {/* 🔥 CANCELAR */}
      {hasSubscription && (
        <button
          onClick={async () => {
            if (!confirm("¿Cancelar suscripción de este usuario?")) return;

            await fetch("/api/admin/users", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                targetUserId: userId,
                action: "cancel_subscription",
              }),
            });

            window.location.reload();
          }}
          style={btnYellow}
        >
          Cancelar suscripción
        </button>
      )}

      {/* 🔥 REACTIVAR */}
      {!hasSubscription && (
        <button
          onClick={async () => {
            const confirmAction = confirm(
              "¿Reactivar suscripción de este usuario?"
            );

            if (!confirmAction) return;

            const res = await fetch("/api/admin/users", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                targetUserId: userId,
                action: "reactivate_subscription",
              }),
            });

            const data = await res.json();

            // 🔥 FIX REAL
            if (!data.success) {
              alert("Error reactivando suscripción");
              return;
            }

            // ✔ éxito
            window.location.reload();
          }}
          style={btnBlue}
        >
          Reactivar suscripción
        </button>
      )}

    </div>
  );
}

const btnRed = {
  background: "#B91C1C",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
};

const btnGreen = {
  background: "#16A34A",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
};

const btnDark = {
  background: "#111827",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
};

const btnYellow = {
  background: "#F59E0B",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
};

const btnBlue = {
  background: "#2563EB",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
};