"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { calculateGrade, formatDate } from "@/lib/utils";

type ExamCard = {
  id: string;
  name: string;
  subject: string;
  date: string;
  totalMarks: number;
  batch: {
    id: string;
    name: string;
    students: Array<{
      id: string;
      rollNo: string;
      user: {
        name: string;
      };
    }>;
  };
  results?: Array<{
    studentId: string;
    marksObtained: number;
    remarks: string | null;
  }>;
};

type DraftRow = {
  studentId: string;
  marksObtained: number;
  remarks: string;
};

export default function FacultyExamsPage() {
  const [exams, setExams] = useState<ExamCard[]>([]);
  const [expandedExamId, setExpandedExamId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Record<string, DraftRow>>>({});

  useEffect(() => {
    const loadExams = async () => {
      try {
        const response = await fetch("/api/exams");
        const data = (await response.json()) as { exams?: ExamCard[] };
        setExams(data.exams ?? []);
      } catch {
        toast.error("✗ Unable to load exams");
      }
    };

    void loadExams();
  }, []);

  useEffect(() => {
    if (!expandedExamId) return;

    const loadResults = async () => {
      try {
        const response = await fetch(`/api/results?examId=${expandedExamId}`);
        const data = (await response.json()) as {
          results?: Array<{
            studentId: string;
            marksObtained: number;
            remarks: string | null;
          }>;
        };

        const exam = exams.find((item) => item.id === expandedExamId);
        if (!exam) return;

        const mapped = exam.batch.students.reduce<Record<string, DraftRow>>((accumulator, student) => {
          const existing = data.results?.find((item) => item.studentId === student.id);
          accumulator[student.id] = {
            studentId: student.id,
            marksObtained: existing?.marksObtained ?? 0,
            remarks: existing?.remarks ?? "",
          };
          return accumulator;
        }, {});

        setDrafts((current) => ({
          ...current,
          [expandedExamId]: mapped,
        }));
      } catch {
        toast.error("✗ Unable to load exam results");
      }
    };

    void loadResults();
  }, [expandedExamId, exams]);

  const expandedExam = useMemo(
    () => exams.find((exam) => exam.id === expandedExamId) ?? null,
    [exams, expandedExamId],
  );

  const saveExamResults = async (examId: string) => {
    const rows = Object.values(drafts[examId] ?? {});

    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId,
          results: rows,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to save marks");
      }

      toast.success("✓ Marks saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(`✗ ${message}`);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-outfit text-3xl font-semibold text-white">My Exams</h1>
        <p className="mt-1 text-sm text-brand-muted">Review upcoming tests and enter marks inline for each batch.</p>
      </div>

      <div className="space-y-4">
        {exams.map((exam) => {
          const enteredCount = exam.results?.length ?? 0;
          const totalStudents = exam.batch.students.length;
          const isExpanded = expandedExamId === exam.id;

          return (
            <article key={exam.id} className="premium-card rounded-3xl p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-outfit text-2xl font-semibold text-white">{exam.name}</h2>
                  <p className="mt-2 text-sm text-brand-muted">
                    {exam.batch.name} · {exam.subject} · {formatDate(exam.date)}
                  </p>
                  <p className="mt-2 text-sm text-brand-muted">{exam.totalMarks} marks total</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      enteredCount === 0
                        ? "border border-red-500/20 bg-red-500/10 text-red-400"
                        : enteredCount < totalStudents
                          ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                          : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {enteredCount}/{totalStudents} entered
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedExamId((current) => (current === exam.id ? "" : exam.id))}
                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
                  >
                    Enter Marks
                  </button>
                </div>
              </div>

              {isExpanded && expandedExam ? (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-brand-border text-brand-muted">
                      <tr>
                        <th className="px-3 py-3">Student</th>
                        <th className="px-3 py-3">Roll No</th>
                        <th className="px-3 py-3">Marks</th>
                        <th className="px-3 py-3">Grade</th>
                        <th className="px-3 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expandedExam.batch.students.map((student) => {
                        const draft = drafts[expandedExam.id]?.[student.id] ?? {
                          studentId: student.id,
                          marksObtained: 0,
                          remarks: "",
                        };
                        const grade = calculateGrade(draft.marksObtained, expandedExam.totalMarks);

                        return (
                          <tr key={student.id} className="border-b border-brand-border/60 hover:bg-[#16162A]">
                            <td className="px-3 py-3 text-white">{student.user.name}</td>
                            <td className="px-3 py-3 text-brand-muted">{student.rollNo}</td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min={0}
                                max={expandedExam.totalMarks}
                                value={draft.marksObtained}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [expandedExam.id]: {
                                      ...(current[expandedExam.id] ?? {}),
                                      [student.id]: {
                                        ...draft,
                                        marksObtained: Number(event.target.value),
                                      },
                                    },
                                  }))
                                }
                                className="h-10 w-24 rounded-xl border border-brand-border bg-brand-dark px-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300">
                                {grade}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={draft.remarks}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [expandedExam.id]: {
                                      ...(current[expandedExam.id] ?? {}),
                                      [student.id]: {
                                        ...draft,
                                        remarks: event.target.value,
                                      },
                                    },
                                  }))
                                }
                                className="h-10 w-full min-w-44 rounded-xl border border-brand-border bg-brand-dark px-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveExamResults(expandedExam.id)}
                      className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
                    >
                      Save Marks
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
