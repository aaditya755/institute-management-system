"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AttendanceChartProps = {
  data: Array<{
    date: string;
    percentage: number;
  }>;
};

export default function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="attendance-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="date" stroke="#6B6B8A" tickLine={false} axisLine={false} />
          <YAxis stroke="#6B6B8A" tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip
            cursor={{ stroke: "#7C3AED", strokeOpacity: 0.35 }}
            contentStyle={{
              background: "#111120",
              border: "1px solid #1C1C2E",
              borderRadius: "16px",
              color: "#EEEEFF",
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, "Attendance"]}
          />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="#7C3AED"
            strokeWidth={3}
            fill="url(#attendance-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
