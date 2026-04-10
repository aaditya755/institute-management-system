"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type FeeCollectionChartProps = {
  data: Array<{
    month: string;
    amount: number;
  }>;
};

export default function FeeCollectionChart({ data }: FeeCollectionChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="month" stroke="#6B6B8A" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#6B6B8A"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${Number(value) / 1000}k`}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              background: "#111120",
              border: "1px solid #1C1C2E",
              borderRadius: "16px",
              color: "#EEEEFF",
            }}
            formatter={(value: number) => [formatCurrency(value), "Collected"]}
          />
          <Bar dataKey="amount" fill="#7C3AED" radius={[14, 14, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
