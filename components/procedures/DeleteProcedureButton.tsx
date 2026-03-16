"use client";

import { deleteProcedure } from "@/actions/deleteProcedure";

export default function DeleteProcedureButton({
  procedureId,
  patientId,
}: {
  procedureId: string;
  patientId: string;
}) {
  const handleDelete = async () => {
    const confirmed = confirm(
      "¿Seguro que deseas eliminar este procedimiento?"
    );

    if (!confirmed) return;

    await deleteProcedure(procedureId);

    window.location.href = `/patients/${patientId}`;
  };

  return (
    <button
      onClick={handleDelete}
      style={{
        background: "#DC2626",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      Eliminar procedimiento
    </button>
  );
}