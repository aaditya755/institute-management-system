"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { calculateGrade } from "@/lib/utils";

type ExamOption = {
  id: string;
  name: string;
  date: string;
  totalMarks: number;
  batch: {
    id: string;
    name: string;
  };
};

type StudentRow = {
  id: string;
  rollNo: string;
  user: {
    name: string;
  };
};

type ExistingResult = {
  studentId: string;
  marksObtained: number;
  remarks: string | null;
  grade: string;
};

type ResultDraft = {
  studentId: string;
  marksObtained: number;
  remarks: string;
};

export default function AdminResultsPage() {
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ResultDraft>>({});
  const [loading, setLoading] = useState(false);

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId),
    [exams, selectedExamId],
  );

  useEffect(() => {
    const loadExams = async () => {
      try {
        const response = await fetch("/api/exams");
        const data = (await response.json()) as { exams?: ExamOption[] };
        setExams(data.exams ?? []);
      } catch {
        toast.error("✗ Unable to load exams");
      }
    };

    void loadExams();
  }, []);

  useEffect(() => {
    if (!selectedExam) {
      setStudents([]);
      setDrafts({});
      return;
    }

    const loadContext = async () => {
      setLoading(true);
      try {
        const [batchResponse, resultResponse] = await Promise.all([
          fetch(`/api/batches/${selectedExam.batch.id}`),
          fetch(`/api/results?examId=${selectedExam.id}`),
        ]);

        const batchData = (await batchResponse.json()) as {
          batch?: { students: StudentRow[] };
        };
        const resultData = (await resultResponse.json()) as {
          results?: ExistingResult[];
        };

        const nextStudents = batchData.batch?.students ?? [];
        const existing = resultData.results ?? [];

        const nextDrafts = nextStudents.reduce<Record<string, ResultDraft>>((accumulator, student) => {
          const matched = existing.find((result) => result.studentId === student.id);
          accumulator[student.id] = {
            studentId: student.id,
            marksObtained: matched?.marksObtained ?? 0,
            remarks: matched?.remarks ?? "",
          };
          return accumulator;
        }, {});

        setStudents(nextStudents);
        setDrafts(nextDrafts);
      } catch {
        toast.error("✗ Unable to load exam details");
      } finally {
        setLoading(false);
      }
    };

    void loadContext();
  }, [selectedExam]);

  const saveResults = async () => {
    if (!selectedExam) return;

    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId: selectedExam.id,
          results: Object.values(drafts),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to save results");
      }

      toast.success("✓ Results saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(`✗ ${message}`);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-outfit text-3xl font-semibold text-white">Enter Results</h1>
        <p className="mt-1 text-sm text-brand-muted">Select an exam, enter marks, and auto-calculate grades.</p>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <div className="space-y-2">
          <label htmlFor="examId" className="text-sm font-medium text-white">
            Select Exam
          </label>
          <select
            id="examId"
            value={selectedExamId}
            onChange={(event) => setSelectedExamId(event.target.value)}
            className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
          >
            <option value="">Choose an exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} · {exam.batch.name} · {exam.totalMarks} marks
              </option>
            ))}
          </select>
        </div>

        {selectedExam ? (
          <div className="mt-4 rounded-2xl border border-brand-border bg-white/[0.02] p-4 text-sm text-brand-muted">
            {selectedExam.batch.name} · {selectedExam.totalMarks} marks · {new Date(selectedExam.date).toLocaleDateString()}
          </div>
        ) : null}
      </div>

      {selectedExam ? (
        <div className="premium-card rounded-3xl p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-brand-border text-brand-muted">
                    <tr>
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">Student Name</th>
                      <th className="px-3 py-3">Roll No</th>
                      <th className="px-3 py-3">Marks</th>
                      <th className="px-3 py-3">Grade</th>
                      <th className="px-3 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => {
                      const draft = drafts[student.id] ?? {
                        studentId: student.id,
                        marksObtained: 0,
                        remarks: "",
                      };
                      const grade = calculateGrade(draft.marksObtained, selectedExam.totalMarks);

                      return (
                        <tr key={student.id} className="border-b border-brand-border/60 hover:bg-[#16162A]">
                          <td className="px-3 py-3 text-brand-muted">{index + 1}</td>
                          <td className="px-3 py-3 text-white">{student.user.name}</td>
                          <td className="px-3 py-3 text-brand-muted">{student.rollNo}</td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min={0}
                              max={selectedExam.totalMarks}
                              value={draft.marksObtained}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [student.id]: {
                                    ...draft,
                                    marksObtained: Number(event.target.value),
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
                                  [student.id]: {
                                    ...draft,
                                    remarks: event.target.value,
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
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={saveResults}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
                >
                  Save All Results
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
