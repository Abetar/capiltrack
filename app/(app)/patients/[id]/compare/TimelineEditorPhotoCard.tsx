"use client";

import type { TimelinePhoto } from "./TimelineEditor";

export default function TimelineEditorPhotoCard({
  photo,
  index,
  totalItems,
  isDragging,
  isDragOver,
  onMove,
  onLabelChange,
  onToggleExcluded,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  photo: TimelinePhoto;
  index: number;
  totalItems: number;
  isDragging: boolean;
  isDragOver: boolean;
  onMove: (index: number, direction: "up" | "down") => void;
  onLabelChange: (photoId: string, value: string) => void;
  onToggleExcluded: (photoId: string) => void;
  onDragStart: (photoId: string) => void;
  onDragOver: (photoId: string) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart(photo.id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(photo.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      style={{
        ...photoCard,
        opacity: photo.excludeFromTimeline ? 0.55 : isDragging ? 0.45 : 1,
        borderColor: isDragOver ? "#2563EB" : "#E5E7EB",
        background: isDragOver ? "#EFF6FF" : "#FFFFFF",
        transform: isDragging ? "scale(0.985)" : "scale(1)",
      }}
    >
      <div style={imageColumn}>
        <img src={photo.url} alt="" style={thumb} />

        <div style={positionBadge}>#{index + 1}</div>

        <div style={dragHandle}>☰ Arrastrar</div>
      </div>

      <div style={contentColumn}>
        <div style={photoTopRow}>
          <div>
            <div style={photoMetaLabel}>Consulta</div>
            <div style={photoMetaValue}>
              {new Date(
                photo.consultation?.date ?? photo.createdAt,
              ).toLocaleDateString()}
            </div>
          </div>

          <div style={orderActions}>
            <button
              type="button"
              onClick={() => onMove(index, "up")}
              style={{
                ...orderButton,
                opacity: index === 0 ? 0.4 : 1,
                cursor: index === 0 ? "not-allowed" : "pointer",
              }}
              disabled={index === 0}
            >
              ↑
            </button>

            <button
              type="button"
              onClick={() => onMove(index, "down")}
              style={{
                ...orderButton,
                opacity: index === totalItems - 1 ? 0.4 : 1,
                cursor: index === totalItems - 1 ? "not-allowed" : "pointer",
              }}
              disabled={index === totalItems - 1}
            >
              ↓
            </button>
          </div>
        </div>

        <label style={fieldLabel}>Etiqueta visual</label>

        <input
          value={photo.timelineLabel ?? ""}
          onChange={(event) => onLabelChange(photo.id, event.target.value)}
          placeholder="Ej. Antes, Mes 6, Actual"
          style={input}
        />

        <label style={checkboxLabel}>
          <input
            type="checkbox"
            checked={photo.excludeFromTimeline}
            onChange={() => onToggleExcluded(photo.id)}
          />
          Ocultar de comparación
        </label>
      </div>
    </article>
  );
}

const photoCard: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "220px 1fr",
  gap: 18,
  border: "1px solid #E5E7EB",
  borderRadius: 16,
  padding: 16,
  background: "#FFFFFF",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
  transition:
    "border-color 0.15s ease, background 0.15s ease, opacity 0.15s ease, transform 0.18s ease",
  cursor: "grab",
};

const imageColumn: React.CSSProperties = {
  position: "relative",
};

const thumb: React.CSSProperties = {
  width: "100%",
  height: 190,
  objectFit: "cover",
  borderRadius: 14,
  border: "1px solid #E5E7EB",
  display: "block",
};

const positionBadge: React.CSSProperties = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "rgba(17, 24, 39, 0.78)",
  color: "white",
  fontSize: 12,
  fontWeight: 700,
  padding: "4px 8px",
  borderRadius: 999,
};

const dragHandle: React.CSSProperties = {
  position: "absolute",
  bottom: 10,
  left: 10,
  background: "rgba(255, 255, 255, 0.92)",
  color: "#374151",
  fontSize: 12,
  fontWeight: 700,
  padding: "5px 8px",
  borderRadius: 999,
  border: "1px solid #E5E7EB",
};

const contentColumn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
};

const photoTopRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 14,
};

const photoMetaLabel: React.CSSProperties = {
  fontSize: 11,
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 3,
};

const photoMetaValue: React.CSSProperties = {
  fontSize: 14,
  color: "#111827",
  fontWeight: 700,
};

const fieldLabel: React.CSSProperties = {
  fontSize: 13,
  color: "#374151",
  fontWeight: 600,
  marginBottom: 6,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: 10,
  fontSize: 14,
  background: "#FFFFFF",
};

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 12,
  fontSize: 13,
  color: "#374151",
};

const orderActions: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexShrink: 0,
};

const orderButton: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "1px solid #D1D5DB",
  background: "white",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 800,
  color: "#111827",
};