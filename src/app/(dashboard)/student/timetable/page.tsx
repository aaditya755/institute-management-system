import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatTime } from "@/lib/utils";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function StudentTimetablePage() {
  const session = await requireRole("STUDENT");

  const student = await prisma.student.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      batch: {
        include: {
          timetables: {
            include: {
              faculty: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: [{ startTime: "asc" }, { day: "asc" }],
          },
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  const today = dayMap[new Date().getDay()];
  const timeSlots = Array.from(
    new Set(student.batch.timetables.map((item) => `${item.startTime}-${item.endTime}`)),
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-outfit text-3xl font-semibold text-white">Timetable</h1>
        <p className="mt-1 text-sm text-brand-muted">Your weekly class plan for {student.batch.name}.</p>
      </div>

      <div className="premium-card overflow-x-auto rounded-3xl p-5">
        <div className="grid min-w-[900px] grid-cols-7 gap-3">
          <div className="rounded-2xl border border-brand-border bg-brand-dark p-4 text-sm font-medium text-brand-muted">
            Time
          </div>
          {weekDays.map((day) => (
            <div
              key={day}
              className={`rounded-2xl border p-4 text-center text-sm font-medium ${
                day === today
                  ? "border-violet-500 bg-violet-500/10 text-white"
                  : "border-brand-border bg-brand-dark text-white"
              }`}
            >
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
                  const entry = student.batch.timetables.find(
                    (item) => item.day === day && item.startTime === startTime && item.endTime === endTime,
                  );

                  return (
                    <div
                      key={`${slot}-${day}`}
                      className={`min-h-28 rounded-2xl border p-3 ${
                        day === today
                          ? "border-violet-500/30 bg-violet-500/10"
                          : "border-brand-border bg-white/[0.02]"
                      }`}
                    >
                      {entry ? (
                        <div className="h-full rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
                          <p className="font-medium text-white">{entry.subject}</p>
                          <p className="mt-1 text-xs text-brand-muted">{entry.faculty.user.name}</p>
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
