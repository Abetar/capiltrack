"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ProgressChart({ data }: { data: any[] }) {
  return (
    <div
      style={{
        width: "100%",
        height: 250,
      }}
    >
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#E5E7EB" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            tick={{ fontSize: 12 }}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="density"
            stroke="#2C6BED"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}