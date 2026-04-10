"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type ResultRow = {
  id: string;
  marksObtained: number;
  grade: string;
  remarks: string | null;
  exam: {
    name: string;
    subject: string;
    date: string;
    totalMarks: number;
  };
};

const gradeStyles: Record<string, string> = {
  "A+": "border border-violet-500/20 bg-violet-500/10 text-violet-300",
  A: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  "B+": "border border-blue-500/20 bg-blue-500/10 text-blue-300",
  B: "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  C: "border border-amber-500/20 bg-amber-500/10 text-amber-300",
  D: "border border-orange-500/20 bg-orange-500/10 text-orange-300",
  F: "border border-red-500/20 bg-red-500/10 text-red-300",
};

export default function StudentResultsPage() {
  const [results, setResults] = useState<ResultRow[]>([]);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const response = await fetch("/api/results");
        const data = (await response.json()) as { results?: ResultRow[] };
        setResults(data.results ?? []);
      } catch {
        toast.error("✗ Unable to load results");
      }
    };

    void loadResults();
  }, []);

  const summary = useMemo(() => {
    const totalExams = results.length;
    const average =
      totalExams === 0
        ? 0
        : results.reduce((sum, result) => sum + (result.marksObtained / result.exam.totalMarks) * 100, 0) /
          totalExams;
    const best = results.reduce((max, result) => {
      const percentage = (result.marksObtained / result.exam.totalMarks) * 100;
      return Math.max(max, percentage);
    }, 0);
    const distribution = results.reduce<Record<string, number>>((accumulator, result) => {
      accumulator[result.grade] = (accumulator[result.grade] ?? 0) + 1;
      return accumulator;
    }, {});
    return { totalExams, average, best, distribution };
  }, [results]);

  return (
    <section className="space-y-6 print:space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Results</h1>
          <p className="mt-1 text-sm text-brand-muted">Review your academic performance and export a clean report.</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
        >
          Export to PDF
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-brand-muted">Average %</p>
          <p className="mt-3 font-outfit text-3xl font-semibold text-white">{summary.average.toFixed(1)}%</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-brand-muted">Best Score</p>
          <p className="mt-3 font-outfit text-3xl font-semibold text-white">{summary.best.toFixed(1)}%</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-brand-muted">Total Exams</p>
          <p className="mt-3 font-outfit text-3xl font-semibold text-white">{summary.totalExams}</p>
        </div>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <h2 className="font-outfit text-xl font-semibold text-white">Grade Distribution</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {["A+", "A", "B+", "B", "C", "D", "F"].map((grade) => (
            <div key={grade} className="rounded-2xl border border-brand-border bg-white/[0.02] px-4 py-3">
              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs ${gradeStyles[grade]}`}>{grade}</div>
              <p className="mt-2 text-sm text-brand-muted">{summary.distribution[grade] ?? 0} exams</p>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card print-results rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-border text-brand-muted">
              <tr>
                <th className="px-3 py-3">Exam</th>
                <th className="px-3 py-3">Subject</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Marks</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">%</th>
                <th className="px-3 py-3">Grade</th>
                <th className="px-3 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const percentage = (result.marksObtained / result.exam.totalMarks) * 100;
                return (
                  <tr key={result.id} className="border-b border-brand-border/60 hover:bg-[#16162A]">
                    <td className="px-3 py-3 text-white">{result.exam.name}</td>
                    <td className="px-3 py-3 text-brand-muted">{result.exam.subject}</td>
                    <td className="px-3 py-3 text-brand-muted">{formatDate(result.exam.date)}</td>
                    <td className="px-3 py-3 text-white">{result.marksObtained}</td>
                    <td className="px-3 py-3 text-brand-muted">{result.exam.totalMarks}</td>
                    <td className="px-3 py-3 text-white">{percentage.toFixed(1)}%</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs ${gradeStyles[result.grade] ?? gradeStyles.F}`}>
                        {result.grade}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-brand-muted">{result.remarks ?? "No remarks"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
