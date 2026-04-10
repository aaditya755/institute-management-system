"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";

type AttendanceItem = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
};

const dotColor: Record<AttendanceItem["status"], string> = {
  PRESENT: "bg-emerald-400",
  ABSENT: "bg-red-400",
  LATE: "bg-amber-400",
};

export default function StudentAttendancePage() {
  const [cursor, setCursor] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);

  const month = cursor.getMonth() + 1;
  const year = cursor.getFullYear();

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const response = await fetch(`/api/attendance?month=${month}&year=${year}`);
        const data = (await response.json()) as { attendance?: AttendanceItem[] };
        setAttendance(data.attendance ?? []);
      } catch {
        toast.error("✗ Unable to load attendance");
      }
    };

    void loadAttendance();
  }, [month, year]);

  const days = eachDayOfInterval({
    start: startOfMonth(cursor),
    end: endOfMonth(cursor),
  });

  const stats = useMemo(() => {
    const present = attendance.filter((item) => item.status === "PRESENT").length;
    const absent = attendance.filter((item) => item.status === "ABSENT").length;
    const late = attendance.filter((item) => item.status === "LATE").length;
    const total = attendance.length;
    const percentage = total === 0 ? 0 : (present / total) * 100;
    return { present, absent, late, percentage };
  }, [attendance]);

  const overallColor =
    stats.percentage > 75 ? "text-emerald-400" : stats.percentage >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Attendance</h1>
          <p className="mt-1 text-sm text-brand-muted">Track your month-by-month consistency and class presence.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((current) => subMonths(current, 1))}
            className="rounded-xl border border-brand-border px-3 py-2 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
          >
            Prev
          </button>
          <div className="rounded-xl border border-brand-border px-4 py-2 text-sm text-white">
            {format(cursor, "MMMM yyyy")}
          </div>
          <button
            type="button"
            onClick={() => setCursor((current) => addMonths(current, 1))}
            className="rounded-xl border border-brand-border px-3 py-2 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
          >
            Next
          </button>
        </div>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <div className="grid grid-cols-7 gap-3 text-center text-xs uppercase tracking-[0.16em] text-brand-muted">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-7 gap-3">
          {days.map((day) => {
            const matched = attendance.find((item) => isSameDay(new Date(item.date), day));
            const today = isSameDay(day, new Date());
            const weekday = day.getDay();
            const shifted = weekday === 0 ? 6 : weekday - 1;

            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 rounded-2xl border p-3 ${
                  today ? "border-violet-500 bg-violet-500/10" : "border-brand-border bg-white/[0.02]"
                } ${shifted === 6 ? "" : ""}`}
              >
                <div className="text-sm text-white">{format(day, "d")}</div>
                {matched ? (
                  <div className={`mt-3 h-2.5 w-2.5 rounded-full ${dotColor[matched.status]}`} />
                ) : (
                  <div className="mt-3 h-2.5 w-2.5 rounded-full bg-transparent" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-emerald-300">Present</p>
          <p className="mt-2 font-outfit text-3xl font-semibold text-white">{stats.present}</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-red-300">Absent</p>
          <p className="mt-2 font-outfit text-3xl font-semibold text-white">{stats.absent}</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-amber-300">Late</p>
          <p className="mt-2 font-outfit text-3xl font-semibold text-white">{stats.late}</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-brand-muted">Percentage</p>
          <p className={`mt-2 font-outfit text-3xl font-semibold ${overallColor}`}>{stats.percentage.toFixed(0)}%</p>
        </div>
      </div>
    </section>
  );
}
