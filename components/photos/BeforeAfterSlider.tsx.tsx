"use client";

import { useState } from "react";

export default function BeforeAfterSlider({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const [position, setPosition] = useState(50);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 600,
        overflow: "hidden",
        borderRadius: 12,
      }}
    >
      {/* AFTER */}
      <img
        src={after}
        style={{
          width: "100%",
          display: "block",
        }}
      />

      {/* BEFORE */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${position}%`,
          overflow: "hidden",
        }}
      >
        <img
          src={before}
          style={{
            width: "100%",
            display: "block",
          }}
        />
      </div>

      {/* SLIDER */}
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
        }}
      />
    </div>
  );
}