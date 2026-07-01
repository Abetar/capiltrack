"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TimelineEditorPhotoCard from "./TimelineEditorPhotoCard";

export type TimelinePhoto = {
  id: string;
  url: string;
  createdAt: string;
  timelineOrder: number | null;
  timelineLabel: string | null;
  excludeFromTimeline: boolean;
  consultation: {
    date: string;
  } | null;
};

export default function TimelineEditor({
  patientId,
  zoneLabel,
  photos,
}: {
  patientId: string;
  zoneLabel: string;
  photos: TimelinePhoto[];
}) {
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const initialPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      if (a.timelineOrder !== null && b.timelineOrder !== null) {
        return a.timelineOrder - b.timelineOrder;
      }

      if (a.timelineOrder !== null) return -1;
      if (b.timelineOrder !== null) return 1;

      const aDate = new Date(a.consultation?.date ?? a.createdAt);
      const bDate = new Date(b.consultation?.date ?? b.createdAt);

      return aDate.getTime() - bDate.getTime();
    });
  }, [photos]);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialPhotos);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function moveItem(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= items.length) return;

    const copy = [...items];
    const current = copy[index];
    const target = copy[targetIndex];

    copy[index] = target;
    copy[targetIndex] = current;

    setItems(copy);
  }

  function moveItemById(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;

    setItems((current) => {
      const sourceIndex = current.findIndex((item) => item.id === sourceId);
      const targetIndex = current.findIndex((item) => item.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return current;

      const copy = [...current];
      const [removed] = copy.splice(sourceIndex, 1);

      copy.splice(targetIndex, 0, removed);

      return copy;
    });
  }

  function autoScrollDrawer(event: React.DragEvent) {
    const drawerElement = drawerRef.current;

    if (!drawerElement) return;

    const rect = drawerElement.getBoundingClientRect();
    const threshold = 130;

    const distanceFromTop = event.clientY - rect.top;
    const distanceFromBottom = rect.bottom - event.clientY;

    if (distanceFromTop < threshold) {
      const intensity = (threshold - distanceFromTop) / threshold;
      drawerElement.scrollBy({
        top: -Math.ceil(28 * intensity),
        behavior: "auto",
      });
    }

    if (distanceFromBottom < threshold) {
      const intensity = (threshold - distanceFromBottom) / threshold;
      drawerElement.scrollBy({
        top: Math.ceil(28 * intensity),
        behavior: "auto",
      });
    }
  }

  function updateLabel(photoId: string, value: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === photoId ? { ...item, timelineLabel: value } : item,
      ),
    );
  }

  function toggleExcluded(photoId: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === photoId
          ? { ...item, excludeFromTimeline: !item.excludeFromTimeline }
          : item,
      ),
    );
  }

  function handleDragStart(photoId: string) {
    setDraggingId(photoId);
  }

  function handleDragOver(photoId: string, event: React.DragEvent) {
    autoScrollDrawer(event);

    setDragOverId(photoId);

    if (!draggingId || draggingId === photoId) return;

    moveItemById(draggingId, photoId);
  }

  function handleDrop() {
    setDraggingId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  async function saveChanges() {
    setSaving(true);

    const res = await fetch(`/api/patients/${patientId}/photos/timeline`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updates: items.map((item, index) => ({
          id: item.id,
          timelineOrder: index + 1,
          timelineLabel: item.timelineLabel,
          excludeFromTimeline: item.excludeFromTimeline,
        })),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      alert("No se pudo guardar la línea de tiempo.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={editButton}>
        Editar línea de tiempo
      </button>

      {open && (
        <div style={overlay}>
          <div ref={drawerRef} style={drawer}>
            <div style={drawerHeader}>
              <div>
                <h2 style={drawerTitle}>Editar línea de tiempo</h2>
                <p style={drawerSubtitle}>
                  Organiza visualmente las fotos de {zoneLabel.toLowerCase()}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                style={closeButton}
              >
                Cerrar
              </button>
            </div>

            <div style={helperBox}>
              Puedes arrastrar las fotos para cambiar el orden o usar las
              flechas. La etiqueta es opcional y se mostrará debajo del slider.
            </div>

            <div style={list}>
              {items.map((photo, index) => (
                <TimelineEditorPhotoCard
                  key={photo.id}
                  photo={photo}
                  index={index}
                  totalItems={items.length}
                  isDragging={draggingId === photo.id}
                  isDragOver={dragOverId === photo.id}
                  onMove={moveItem}
                  onLabelChange={updateLabel}
                  onToggleExcluded={toggleExcluded}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>

            <div style={drawerFooter}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={secondaryButton}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                style={primaryButton}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const editButton: React.CSSProperties = {
  background: "#EFF6FF",
  color: "#1D4ED8",
  border: "1px solid #BFDBFE",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.42)",
  zIndex: 9999,
  display: "flex",
  justifyContent: "flex-end",
};

const drawer: React.CSSProperties = {
  width: "min(760px, 100%)",
  height: "100%",
  background: "#F8FAFC",
  padding: 24,
  overflowY: "auto",
  boxShadow: "-12px 0 40px rgba(15, 23, 42, 0.22)",
};

const drawerHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 16,
};

const drawerTitle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  margin: 0,
  color: "#111827",
};

const drawerSubtitle: React.CSSProperties = {
  fontSize: 14,
  color: "#6B7280",
  marginTop: 6,
  marginBottom: 0,
};

const closeButton: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  background: "white",
  borderRadius: 10,
  padding: "9px 12px",
  cursor: "pointer",
  fontWeight: 600,
  color: "#374151",
};

const helperBox: React.CSSProperties = {
  background: "#EEF2FF",
  border: "1px solid #C7D2FE",
  color: "#3730A3",
  borderRadius: 12,
  padding: 14,
  fontSize: 13,
  lineHeight: 1.5,
  marginBottom: 18,
};

const list: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 16,
};

const drawerFooter: React.CSSProperties = {
  position: "sticky",
  bottom: 0,
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 24,
  paddingTop: 16,
  borderTop: "1px solid #E5E7EB",
  background: "#F8FAFC",
};

const secondaryButton: React.CSSProperties = {
  background: "white",
  color: "#374151",
  border: "1px solid #D1D5DB",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
};

const primaryButton: React.CSSProperties = {
  background: "#2563EB",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};