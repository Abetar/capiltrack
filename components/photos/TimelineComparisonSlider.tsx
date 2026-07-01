"use client";

import { useState } from "react";

type Photo = {
  id: string;
  url: string;
  createdAt: Date | string;
  timelineOrder?: number | null;
  timelineLabel?: string | null;
  excludeFromTimeline?: boolean;
  consultation?: {
    date: Date | string;
  } | null;
};

export default function TimelineComparisonSlider({
  photos,
}: {
  photos: Photo[];
}) {
  const sorted = [...photos]
    .filter((photo) => !photo.excludeFromTimeline)
    .sort((a, b) => {
      if (a.timelineOrder !== null && a.timelineOrder !== undefined && b.timelineOrder !== null && b.timelineOrder !== undefined) {
        return a.timelineOrder - b.timelineOrder;
      }

      if (a.timelineOrder !== null && a.timelineOrder !== undefined) return -1;
      if (b.timelineOrder !== null && b.timelineOrder !== undefined) return 1;

      const aDate = getPhotoDate(a);
      const bDate = getPhotoDate(b);

      return aDate.getTime() - bDate.getTime();
    });

  const [index, setIndex] = useState(sorted.length - 1);

  if (sorted.length < 2) {
    return null;
  }

  const before = sorted[0];
  const current = sorted[index];

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <img src={before.url} style={imageStyle} alt="" />

          <div style={captionStyle}>
            Antes — {getPhotoLabel(before)}
          </div>
        </div>

        <div>
          <img src={current.url} style={imageStyle} alt="" />

          <div style={captionStyle}>
            Evolución — {getPhotoLabel(current)}
          </div>
        </div>
      </div>

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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#6B7280",
          marginTop: 4,
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {sorted.map((photo) => (
          <span
            key={photo.id}
            style={{
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {getPhotoLabel(photo)}
          </span>
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

function getPhotoLabel(photo: Photo) {
  if (photo.timelineLabel?.trim()) {
    return photo.timelineLabel.trim();
  }

  return formatDate(getPhotoDate(photo));
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