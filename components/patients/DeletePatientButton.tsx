"use client";

import { deletePatient } from "@/actions/deletePatient";

export default function DeletePatientButton({
  patientId,
}: {
  patientId: string;
}) {
  const handleDelete = async () => {
    const confirmed = confirm(
      "¿Seguro que deseas eliminar este paciente?\n\nEsta acción eliminará consultas, fotos, métricas, tratamientos y procedimientos asociados."
    );

    if (!confirmed) return;

    await deletePatient(patientId);

    window.location.href = "/patients";
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
      Eliminar paciente
    </button>
  );
}