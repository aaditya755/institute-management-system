"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

type BatchCard = {
  id: string;
  name: string;
  subject: string;
  students: Array<{
    id: string;
    rollNo: string;
    user: {
      name: string;
    };
  }>;
};

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

type AttendanceRecord = {
  studentId: string;
  status: AttendanceStatus;
};

const statusStyles: Record<AttendanceStatus, string> = {
  PRESENT: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  LATE: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  ABSENT: "border-red-500/20 bg-red-500/10 text-red-400",
};

export default function FacultyAttendancePage() {
  const [batches, setBatches] = useState<BatchCard[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const response = await fetch("/api/batches");
        const data = (await response.json()) as { batches?: BatchCard[] };
        const nextBatches = data.batches ?? [];
        setBatches(nextBatches);
        if (nextBatches[0]) {
          setSelectedBatchId(nextBatches[0].id);
        }
      } catch {
        toast.error("✗ Unable to load batches");
      } finally {
        setLoading(false);
      }
    };

    void loadBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatchId) return;

    const loadAttendance = async () => {
      try {
        const response = await fetch(`/api/attendance?batchId=${selectedBatchId}&date=${selectedDate}`);
        const data = (await response.json()) as {
          attendance?: Array<{ studentId: string; status: AttendanceStatus }>;
        };

        const mapped = (data.attendance ?? []).reduce<Record<string, AttendanceStatus>>((accumulator, item) => {
          accumulator[item.studentId] = item.status;
          return accumulator;
        }, {});

        setRecords(mapped);
      } catch {
        toast.error("✗ Unable to load attendance");
      }
    };

    void loadAttendance();
  }, [selectedBatchId, selectedDate]);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) ?? null,
    [batches, selectedBatchId],
  );

  const incompleteCount = selectedBatch
    ? selectedBatch.students.filter((student) => !records[student.id]).length
    : 0;

  const applyBulk = (status: AttendanceStatus) => {
    if (!selectedBatch) return;
    setRecords(
      selectedBatch.students.reduce<Record<string, AttendanceStatus>>((accumulator, student) => {
        accumulator[student.id] = status;
        return accumulator;
      }, {}),
    );
  };

  const saveAttendance = async () => {
    if (!selectedBatch) return;

    if (incompleteCount > 0) {
      const confirmed = window.confirm(
        `${incompleteCount} students are still unmarked. Save attendance anyway?`,
      );
      if (!confirmed) return;
    }

    setSaving(true);
    try {
      const payload: AttendanceRecord[] = selectedBatch.students
        .filter((student) => records[student.id])
        .map((student) => ({
          studentId: student.id,
          status: records[student.id],
        }));

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId: selectedBatch.id,
          date: selectedDate,
          records: payload,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to save attendance");
      }

      toast.success("✓ Attendance saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(`✗ ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-outfit text-3xl font-semibold text-white">Attendance</h1>
        <p className="mt-1 text-sm text-brand-muted">Select a batch, pick a date, and mark each student quickly.</p>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <h2 className="font-outfit text-xl font-semibold text-white">Step 1: Select Batch</h2>
        {loading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {batches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                onClick={() => setSelectedBatchId(batch.id)}
                className={`rounded-3xl border p-5 text-left transition ${
                  selectedBatchId === batch.id
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-brand-border bg-white/[0.02] hover:border-violet-500/50"
                }`}
              >
                <h3 className="font-outfit text-xl font-semibold text-white">{batch.name}</h3>
                <p className="mt-2 text-sm text-brand-muted">{batch.subject}</p>
                <p className="mt-4 text-sm text-brand-muted">{batch.students.length} students</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedBatch ? (
        <>
          <div className="premium-card rounded-3xl p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-outfit text-xl font-semibold text-white">Step 2: Choose Date</h2>
                <p className="text-sm text-brand-muted">Attendance for {selectedBatch.name}</p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-11 rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
          </div>

          <div className="premium-card rounded-3xl p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-outfit text-xl font-semibold text-white">Step 3: Mark Students</h2>
                <p className="text-sm text-brand-muted">Pick present, late, or absent for each learner.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyBulk("PRESENT")}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/15"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => applyBulk("ABSENT")}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/15"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {incompleteCount > 0 ? (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                {incompleteCount} students are still unmarked.
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {selectedBatch.students.map((student) => (
                <article key={student.id} className="rounded-3xl border border-brand-border bg-white/[0.02] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                      {getInitials(student.user.name)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{student.user.name}</p>
                      <p className="text-sm text-brand-muted">{student.rollNo}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(["PRESENT", "LATE", "ABSENT"] as AttendanceStatus[]).map((status) => {
                      const active = records[student.id] === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            setRecords((current) => ({
                              ...current,
                              [student.id]: status,
                            }))
                          }
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                            active
                              ? statusStyles[status]
                              : "border-brand-border text-brand-muted hover:border-violet-500 hover:text-white"
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={saveAttendance}
                disabled={saving}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
