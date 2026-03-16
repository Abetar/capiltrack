"use client";

import { useState } from "react";

type Photo = {
  id: string;
  url: string;
};

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
        }}
      >
        {photos.map((photo) => (
          <img
            key={photo.id}
            src={photo.url}
            onClick={() => setSelected(photo.url)}
            style={{
              width: "100%",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              objectFit: "cover",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 40,
          }}
        >
          <img
            src={selected}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 12,
            }}
          />
        </div>
      )}
    </>
  );
}
