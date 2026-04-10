"use client";

import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AttendanceCalendarItem = {
  id: string;
  date: string | Date;
  status: "PRESENT" | "ABSENT" | "LATE";
};

type AttendanceCalendarProps = {
  attendanceData: AttendanceCalendarItem[];
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
};

const dotColor = {
  PRESENT: "bg-emerald-400",
  ABSENT: "bg-red-400",
  LATE: "bg-amber-400",
};

export default function AttendanceCalendar({
  attendanceData,
  month,
  year,
  onMonthChange,
}: AttendanceCalendarProps) {
  const cursor = new Date(year, month - 1, 1);
  const days = eachDayOfInterval({
    start: startOfMonth(cursor),
    end: endOfMonth(cursor),
  });

  const previousMonth = () => {
    const next = subMonths(cursor, 1);
    onMonthChange(next.getMonth() + 1, next.getFullYear());
  };

  const nextMonth = () => {
    const next = addMonths(cursor, 1);
    onMonthChange(next.getMonth() + 1, next.getFullYear());
  };

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-outfit text-xl font-semibold text-white">{format(cursor, "MMMM yyyy")}</h2>
            <p className="text-sm text-brand-muted">Your attendance view for the selected month.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={previousMonth}>
              Prev
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={nextMonth}>
              Next
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3 text-center text-xs uppercase tracking-[0.16em] text-brand-muted">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {days.map((day) => {
            const matched = attendanceData.find((item) => isSameDay(new Date(item.date), day));
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 rounded-2xl border p-3 ${
                  isToday ? "border-violet-500 bg-violet-500/10" : "border-brand-border bg-white/[0.02]"
                }`}
              >
                <div className="text-sm text-white">{format(day, "d")}</div>
                {matched ? (
                  <div className={`mt-3 h-2.5 w-2.5 rounded-full ${dotColor[matched.status]}`} />
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
