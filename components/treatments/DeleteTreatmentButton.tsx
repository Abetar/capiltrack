"use client";

import { deleteTreatment } from "@/actions/deleteTreatment";

export default function DeleteTreatmentButton({
  treatmentId,
  patientId,
}: {
  treatmentId: string;
  patientId: string;
}) {
  const handleDelete = async () => {
    const confirmed = confirm(
      "¿Seguro que deseas eliminar este tratamiento?"
    );

    if (!confirmed) return;

    await deleteTreatment(treatmentId);

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
      Eliminar tratamiento
    </button>
  );
}