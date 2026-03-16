"use client";

import { useState } from "react";

type Photo = {
  id: string;
  url: string;
  createdAt: Date | string;
  consultation?: {
    date: Date | string;
  } | null;
};

export default function TimelineComparisonSlider({
  photos,
}: {
  photos: Photo[];
}) {
  const sorted = [...photos].sort((a, b) => {
    const aDate = getPhotoDate(a);
    const bDate = getPhotoDate(b);

    return aDate.getTime() - bDate.getTime();
  });

  const [index, setIndex] = useState(sorted.length - 1);

  const before = sorted[0];
  const current = sorted[index];

  return (
    <div style={{ width: "100%" }}>
      {/* COMPARISON */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <img src={before.url} style={imageStyle} />

          <div style={captionStyle}>
            Antes — {formatDate(getPhotoDate(before))}
          </div>
        </div>

        <div>
          <img src={current.url} style={imageStyle} />

          <div style={captionStyle}>
            Evolución — {formatDate(getPhotoDate(current))}
          </div>
        </div>
      </div>

      {/* SLIDER */}

      <input
        type="range"
        min={0}
        max={sorted.length - 1}
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        style={{
          width: "100%",
          marginTop: 6,
        }}
      />

      {/* TIMELINE MARKERS */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#6B7280",
          marginTop: 4,
        }}
      >
        {sorted.map((p) => (
          <span key={p.id}>{formatDate(getPhotoDate(p))}</span>
        ))}
      </div>
    </div>
  );
}

function getPhotoDate(photo: Photo) {
  if (photo.consultation?.date) {
    return new Date(photo.consultation.date);
  }

  return new Date(photo.createdAt);
}

function formatDate(date: Date) {
  return date.toLocaleDateString();
}

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: 280,
  objectFit: "cover",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
};

const captionStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 6,
  textAlign: "center",
};