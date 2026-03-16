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

export default function ClinicMetricsChart({
  data,
}: {
  data: {
    date: string;
    consultations: number;
  }[];
}) {
  return (
    <div
      style={{
        width: "100%",
        height: 300,
      }}
    >
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />

          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="consultations"
            stroke="#2C6BED"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}