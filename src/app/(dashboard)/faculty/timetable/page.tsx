import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatTime } from "@/lib/utils";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function FacultyTimetablePage() {
  const session = await requireRole("FACULTY");

  const faculty = await prisma.faculty.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      timetables: {
        include: {
          batch: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ startTime: "asc" }, { day: "asc" }],
      },
    },
  });

  if (!faculty) {
    return null;
  }

  const timeSlots = Array.from(
    new Set(faculty.timetables.map((item) => `${item.startTime}-${item.endTime}`)),
  );

  return (
    <section className="space-y-6 print:space-y-3">
      <div className="print:hidden">
        <h1 className="font-outfit text-3xl font-semibold text-white">My Timetable</h1>
        <p className="mt-1 text-sm text-brand-muted">A clean weekly view of your assigned teaching slots.</p>
      </div>

      <div className="premium-card print-results overflow-x-auto rounded-3xl p-5">
        <div className="grid min-w-[900px] grid-cols-7 gap-3">
          <div className="rounded-2xl border border-brand-border bg-brand-dark p-4 text-sm font-medium text-brand-muted">
            Time
          </div>
          {weekDays.map((day) => (
            <div key={day} className="rounded-2xl border border-brand-border bg-brand-dark p-4 text-center text-sm font-medium text-white">
              {day}
            </div>
          ))}

          {timeSlots.map((slot) => {
            const [startTime, endTime] = slot.split("-");
            return (
              <div key={slot} className="contents">
                <div className="rounded-2xl border border-brand-border bg-white/[0.02] p-4 text-sm text-brand-muted">
                  {formatTime(startTime)}
                  <br />
                  <span className="text-xs">{formatTime(endTime)}</span>
                </div>
                {weekDays.map((day) => {
                  const entry = faculty.timetables.find(
                    (item) => item.day === day && item.startTime === startTime && item.endTime === endTime,
                  );

                  return (
                    <div key={`${slot}-${day}`} className="min-h-28 rounded-2xl border border-brand-border bg-white/[0.02] p-3">
                      {entry ? (
                        <div className="h-full rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
                          <p className="font-medium text-white">{entry.subject}</p>
                          <p className="mt-1 text-xs text-brand-muted">{entry.batch.name}</p>
                          <p className="mt-3 text-xs text-brand-muted">
                            {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
