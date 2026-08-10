"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Pencil, XCircle } from "lucide-react";
import AppDialog, {
  type AppDialogVariant,
} from "@/components/ui/AppDialog";

type AppointmentActionsProps = {
  appointmentId: string;
  patientName: string;
  status?: string;
};

type DialogMode =
  | "cancel-confirmation"
  | "success"
  | "error"
  | null;

type DialogState = {
  open: boolean;
  mode: DialogMode;
  title: string;
  message: string;
  variant: AppDialogVariant;
  confirmLabel: string;
  cancelLabel: string;
  refreshOnClose: boolean;
};

const INITIAL_DIALOG_STATE: DialogState = {
  open: false,
  mode: null,
  title: "",
  message: "",
  variant: "info",
  confirmLabel: "Aceptar",
  cancelLabel: "Volver",
  refreshOnClose: false,
};

export default function AppointmentActions({
  appointmentId,
  patientName,
  status = "PENDING",
}: AppointmentActionsProps) {
  const router = useRouter();

  const [activeAction, setActiveAction] = useState<
    "confirm" | "cancel" | null
  >(null);

  const [dialog, setDialog] = useState<DialogState>(
    INITIAL_DIALOG_STATE,
  );

  function showErrorDialog(message: string) {
    setDialog({
      open: true,
      mode: "error",
      title: "No se pudo actualizar la cita",
      message,
      variant: "error",
      confirmLabel: "Entendido",
      cancelLabel: "Volver",
      refreshOnClose: false,
    });
  }

  function showSuccessDialog(
    nextStatus: "CONFIRMED" | "CANCELLED",
  ) {
    const isConfirmed = nextStatus === "CONFIRMED";

    setDialog({
      open: true,
      mode: "success",
      title: isConfirmed
        ? "Cita confirmada"
        : "Cita cancelada",
      message: isConfirmed
        ? `La cita de ${patientName} fue confirmada correctamente.`
        : `La cita de ${patientName} fue cancelada correctamente. El registro permanecerá en el historial, pero el horario volverá a estar disponible.`,
      variant: "success",
      confirmLabel: "Aceptar",
      cancelLabel: "Volver",
      refreshOnClose: true,
    });
  }

  function openCancelConfirmation() {
    setDialog({
      open: true,
      mode: "cancel-confirmation",
      title: "Cancelar cita",
      message:
        `¿Deseas cancelar la cita de ${patientName}?\n\n` +
        "La cita permanecerá en el historial clínico, pero dejará de ocupar ese horario.",
      variant: "warning",
      confirmLabel: "Cancelar cita",
      cancelLabel: "Volver",
      refreshOnClose: false,
    });
  }

  function closeDialog() {
    if (activeAction) {
      return;
    }

    setDialog(INITIAL_DIALOG_STATE);
  }

  function handleResultDialogConfirm() {
    const shouldRefresh = dialog.refreshOnClose;

    setDialog(INITIAL_DIALOG_STATE);

    if (shouldRefresh) {
      router.refresh();
    }
  }

  async function updateStatus(
    nextStatus: "CONFIRMED" | "CANCELLED",
  ) {
    setActiveAction(
      nextStatus === "CONFIRMED"
        ? "confirm"
        : "cancel",
    );

    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        showErrorDialog(
          data?.error ||
            "No fue posible actualizar el estado de la cita. Inténtalo nuevamente.",
        );
        return;
      }

      showSuccessDialog(nextStatus);
    } catch (error) {
      console.error(
        "UPDATE_APPOINTMENT_STATUS_ERROR",
        error,
      );

      showErrorDialog(
        "No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleConfirmAppointment() {
    await updateStatus("CONFIRMED");
  }

  async function handleDialogConfirm() {
    if (dialog.mode === "cancel-confirmation") {
      await updateStatus("CANCELLED");
      return;
    }

    handleResultDialogConfirm();
  }

  const isLoading = activeAction !== null;

  return (
    <>
      <div style={actionsContainer}>
        {status === "PENDING" && (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleConfirmAppointment}
            style={{
              ...confirmButton,
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading
                ? "not-allowed"
                : "pointer",
            }}
          >
            <CheckCircle2 size={14} />

            {activeAction === "confirm"
              ? "Confirmando..."
              : "Confirmar"}
          </button>
        )}

        <Link
          href={`/agenda/${appointmentId}/edit`}
          style={{
            ...editButton,
            pointerEvents: isLoading
              ? "none"
              : "auto",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          <Pencil size={14} />
          Editar
        </Link>

        <button
          type="button"
          disabled={isLoading}
          onClick={openCancelConfirmation}
          style={{
            ...cancelButton,
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading
              ? "not-allowed"
              : "pointer",
          }}
        >
          <XCircle size={14} />

          {activeAction === "cancel"
            ? "Cancelando..."
            : "Cancelar"}
        </button>
      </div>

      <AppDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        variant={dialog.variant}
        confirmLabel={dialog.confirmLabel}
        cancelLabel={dialog.cancelLabel}
        isLoading={isLoading}
        onConfirm={handleDialogConfirm}
        onCancel={
          dialog.mode === "cancel-confirmation"
            ? closeDialog
            : undefined
        }
      />
    </>
  );
}

const actionsContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 14,
  paddingTop: 12,
  borderTop: "1px solid #DBEAFE",
};

const confirmButton: React.CSSProperties = {
  minHeight: 34,
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #BBF7D0",
  background: "#F0FDF4",
  color: "#15803D",
  fontSize: 12,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

const editButton: React.CSSProperties = {
  minHeight: 34,
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #BFDBFE",
  background: "white",
  color: "#1D4ED8",
  fontSize: 12,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  textDecoration: "none",
};

const cancelButton: React.CSSProperties = {
  minHeight: 34,
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #FECACA",
  background: "#FEF2F2",
  color: "#B91C1C",
  fontSize: 12,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};