"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type GradeDonutChartProps = {
  data: Array<{
    grade: string;
    value: number;
  }>;
};

const gradeColors: Record<string, string> = {
  "A+": "#7C3AED",
  A: "#10B981",
  "B+": "#3B82F6",
  B: "#06B6D4",
  C: "#F59E0B",
  D: "#F97316",
  F: "#EF4444",
};

export default function GradeDonutChart({ data }: GradeDonutChartProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "#111120",
                border: "1px solid #1C1C2E",
                borderRadius: "16px",
                color: "#EEEEFF",
              }}
              formatter={(value: number) => [value, "Exams"]}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="grade"
              innerRadius={72}
              outerRadius={110}
              paddingAngle={4}
            >
              {data.map((entry) => (
                <Cell key={entry.grade} fill={gradeColors[entry.grade] ?? "#6B6B8A"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-2">
        {data.map((entry) => (
          <div key={entry.grade} className="rounded-2xl border border-brand-border bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: gradeColors[entry.grade] ?? "#6B6B8A" }}
              />
              <span className="font-medium text-white">{entry.grade}</span>
            </div>
            <p className="mt-2 text-sm text-brand-muted">{entry.value} results</p>
          </div>
        ))}
      </div>
    </div>
  );
}
