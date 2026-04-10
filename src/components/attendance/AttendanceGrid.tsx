"use client";

import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

type StudentAttendanceItem = {
  id: string;
  rollNo: string;
  user: {
    name: string;
  };
};

type AttendanceGridProps = {
  students: StudentAttendanceItem[];
  values: Record<string, AttendanceStatus | undefined>;
  onChange: (studentId: string, status: AttendanceStatus) => void;
  onSubmit: () => void;
  onBulkMark: (status: AttendanceStatus) => void;
  loading?: boolean;
};

const buttonStyles: Record<AttendanceStatus, string> = {
  PRESENT: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  LATE: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  ABSENT: "border-red-500/20 bg-red-500/10 text-red-400",
};

export default function AttendanceGrid({
  students,
  values,
  onChange,
  onSubmit,
  onBulkMark,
  loading = false,
}: AttendanceGridProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => onBulkMark("PRESENT")}>
          Mark All Present
        </Button>
        <Button type="button" variant="secondary" onClick={() => onBulkMark("ABSENT")}>
          Mark All Absent
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {students.map((student) => (
          <Card key={student.id} className="bg-white/[0.02]">
            <CardContent className="p-4">
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
                  const active = values[student.id] === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onChange(student.id, status)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        active
                          ? buttonStyles[status]
                          : "border-brand-border text-brand-muted hover:border-violet-500 hover:text-white"
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </div>
  );
}
