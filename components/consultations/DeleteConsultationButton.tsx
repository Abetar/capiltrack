"use client";

import { deleteConsultation } from "@/actions/deleteConsultation";

export default function DeleteConsultationButton({
  consultationId,
  patientId,
}: {
  consultationId: string;
  patientId: string;
}) {
  const handleDelete = async () => {
    const confirmed = confirm(
      "¿Seguro que deseas eliminar esta consulta?\n\nEsto eliminará fotos y métricas asociadas."
    );

    if (!confirmed) return;

    await deleteConsultation(consultationId);

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
      Eliminar consulta
    </button>
  );
}