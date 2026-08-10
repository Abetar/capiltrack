"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

export type AppDialogVariant =
  | "success"
  | "error"
  | "warning"
  | "info";

type AppDialogProps = {
  open: boolean;
  title: string;
  message: string;
  variant?: AppDialogVariant;

  confirmLabel?: string;
  cancelLabel?: string;

  isLoading?: boolean;

  onConfirm: () => void;
  onCancel?: () => void;
};

const VARIANT_CONFIG: Record<
  AppDialogVariant,
  {
    icon: ReactNode;
    iconBackground: string;
    iconColor: string;
    confirmBackground: string;
  }
> = {
  success: {
    icon: <CheckCircle2 size={22} />,
    iconBackground: "#DCFCE7",
    iconColor: "#15803D",
    confirmBackground: "#16A34A",
  },

  error: {
    icon: <AlertCircle size={22} />,
    iconBackground: "#FEE2E2",
    iconColor: "#B91C1C",
    confirmBackground: "#DC2626",
  },

  warning: {
    icon: <TriangleAlert size={22} />,
    iconBackground: "#FEF3C7",
    iconColor: "#B45309",
    confirmBackground: "#D97706",
  },

  info: {
    icon: <Info size={22} />,
    iconBackground: "#DBEAFE",
    iconColor: "#1D4ED8",
    confirmBackground: "#2563EB",
  },
};

export default function AppDialog({
  open,
  title,
  message,
  variant = "info",
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  isLoading = false,
  onConfirm,
  onCancel,
}: AppDialogProps) {
  if (!open) {
    return null;
  }

  const config = VARIANT_CONFIG[variant];
  const isConfirmation = Boolean(onCancel);

  return (
    <div
      role="presentation"
      style={overlayStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && onCancel) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        style={dialogStyle}
      >
        <div style={dialogHeaderStyle}>
          <div
            style={{
              ...iconWrapperStyle,
              background: config.iconBackground,
              color: config.iconColor,
            }}
          >
            {config.icon}
          </div>

          <div style={dialogHeadingStyle}>
            <h2 id="app-dialog-title" style={titleStyle}>
              {title}
            </h2>
          </div>

          {onCancel && (
            <button
              type="button"
              aria-label="Cerrar"
              disabled={isLoading}
              onClick={onCancel}
              style={closeButtonStyle}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <p id="app-dialog-message" style={messageStyle}>
          {message}
        </p>

        <div style={actionsStyle}>
          {isConfirmation && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              style={{
                ...secondaryButtonStyle,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {cancelLabel}
            </button>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            style={{
              ...primaryButtonStyle,
              background: config.confirmBackground,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2000,
  padding: 20,
  background: "rgba(15, 23, 42, 0.48)",
  backdropFilter: "blur(3px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const dialogStyle: CSSProperties = {
  width: "100%",
  maxWidth: 440,
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  background: "white",
  padding: 22,
  boxShadow:
    "0 24px 60px rgba(15, 23, 42, 0.22), 0 8px 20px rgba(15, 23, 42, 0.1)",
};

const dialogHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};

const iconWrapperStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const dialogHeadingStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  paddingTop: 2,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 17,
  lineHeight: 1.35,
  fontWeight: 700,
  color: "#111827",
};

const messageStyle: CSSProperties = {
  margin: "16px 0 0",
  fontSize: 14,
  lineHeight: 1.65,
  color: "#4B5563",
  whiteSpace: "pre-line",
};

const closeButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  border: "none",
  borderRadius: 8,
  background: "transparent",
  color: "#6B7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 9,
  marginTop: 22,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: 40,
  padding: "9px 15px",
  borderRadius: 9,
  border: "1px solid #D1D5DB",
  background: "white",
  color: "#374151",
  fontSize: 13,
  fontWeight: 700,
};

const primaryButtonStyle: CSSProperties = {
  minHeight: 40,
  padding: "9px 15px",
  borderRadius: 9,
  border: "none",
  color: "white",
  fontSize: 13,
  fontWeight: 700,
};