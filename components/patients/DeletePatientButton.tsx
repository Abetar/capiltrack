"use client";

import { deletePatient } from "@/actions/deletePatient";
import { HiTrash } from "react-icons/hi2";

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
      className="patient-summary-action patient-summary-delete-button"
      style={{
        background: "#DC2626",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <HiTrash size={18} />

      <span>Eliminar paciente</span>
    </button>
  );
}