import { CalendarClock, CreditCard, Medal } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function StudentDashboardPage() {
  const session = await requireRole("STUDENT");

  const student = await prisma.student.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      batch: {
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
          timetables: true,
          exams: {
            orderBy: {
              date: "asc",
            },
          },
        },
      },
      attendance: true,
      fees: {
        orderBy: {
          dueDate: "asc",
        },
      },
      results: {
        include: {
          exam: {
            select: {
              name: true,
              subject: true,
              date: true,
              totalMarks: true,
            },
          },
        },
        orderBy: {
          exam: {
            date: "desc",
          },
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  const attendancePercentage =
    student.attendance.length === 0
      ? 0
      : (student.attendance.filter((item) => item.status === "PRESENT").length / student.attendance.length) * 100;
  const nextFeeDue = student.fees.find((fee) => fee.status !== "PAID") ?? null;
  const lastGrade = student.results[0]?.grade ?? "N/A";
  const todaysDay = dayMap[new Date().getDay()];
  const todaysSchedule = student.batch.timetables.filter((item) => item.day === todaysDay);
  const upcomingExams = student.batch.exams.filter((exam) => new Date(exam.date) >= new Date()).slice(0, 3);
  const recentResults = student.results.slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-violet-600/20 to-transparent p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(124,58,237,0.14)_1px,transparent_0)] bg-[size:28px_28px] opacity-30" />
        <div className="relative z-10">
          <h1 className="font-outfit text-3xl font-semibold text-white">Hello, {student.user.name} 👋</h1>
          <p className="mt-2 text-sm text-brand-muted">
            {student.batch.name} · Roll No: {student.rollNo}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-brand-muted">Attendance %</p>
          <div className="mt-5 flex items-center gap-4">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-semibold text-white"
              style={{
                background: `conic-gradient(#7C3AED ${attendancePercentage * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-card">
                {attendancePercentage.toFixed(0)}%
              </div>
            </div>
            <p className="text-sm text-brand-muted">Steady consistency builds momentum.</p>
          </div>
        </div>

        <div className="premium-card rounded-3xl p-5">
          <div className="flex items-center gap-3 text-red-300">
            <CreditCard className="h-5 w-5" />
            <span className="text-sm">Next Fee Due</span>
          </div>
          <p className="mt-4 font-outfit text-3xl font-semibold text-white">
            {nextFeeDue ? formatCurrency(nextFeeDue.amount) : "None"}
          </p>
          <p className="mt-2 text-sm text-brand-muted">
            {nextFeeDue ? formatDate(nextFeeDue.dueDate) : "All installments cleared"}
          </p>
        </div>

        <div className="premium-card rounded-3xl p-5">
          <div className="flex items-center gap-3 text-amber-300">
            <Medal className="h-5 w-5" />
            <span className="text-sm">Last Exam Grade</span>
          </div>
          <p className="mt-4 font-outfit text-3xl font-semibold text-white">{lastGrade}</p>
          <p className="mt-2 text-sm text-brand-muted">
            {student.results[0] ? student.results[0].exam.name : "No results yet"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="premium-card rounded-3xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-violet-300" />
            <div>
              <h2 className="font-outfit text-xl font-semibold text-white">Today&apos;s Schedule</h2>
              <p className="text-sm text-brand-muted">Classes lined up for {todaysDay}</p>
            </div>
          </div>
          <div className="space-y-3">
            {todaysSchedule.length > 0 ? (
              todaysSchedule.map((slot) => (
                <div key={slot.id} className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <p className="font-medium text-white">{slot.subject}</p>
                  <p className="mt-1 text-sm text-brand-muted">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)} · {student.batch.faculty.user.name}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-brand-border bg-white/[0.02] px-4 py-5 text-sm text-brand-muted">
                No classes scheduled today.
              </div>
            )}
          </div>
        </div>

        <div className="premium-card rounded-3xl p-6">
          <h2 className="font-outfit text-xl font-semibold text-white">Upcoming Exams</h2>
          <p className="mt-1 text-sm text-brand-muted">Your next three assessments.</p>
          <div className="mt-5 space-y-3">
            {upcomingExams.length > 0 ? (
              upcomingExams.map((exam) => {
                const daysRemaining = Math.max(
                  0,
                  Math.ceil((new Date(exam.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                );

                return (
                  <div key={exam.id} className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{exam.name}</p>
                        <p className="mt-1 text-sm text-brand-muted">
                          {exam.subject} · {formatDate(exam.date)}
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
                        {daysRemaining} days
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-brand-border bg-white/[0.02] px-4 py-5 text-sm text-brand-muted">
                No upcoming exams scheduled.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <h2 className="font-outfit text-xl font-semibold text-white">Recent Results</h2>
        <p className="mt-1 text-sm text-brand-muted">Your latest exam performance snapshot.</p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-border text-brand-muted">
              <tr>
                <th className="px-3 py-3">Exam</th>
                <th className="px-3 py-3">Subject</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Marks</th>
                <th className="px-3 py-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {recentResults.map((result) => (
                <tr key={result.id} className="border-b border-brand-border/60 hover:bg-[#16162A]">
                  <td className="px-3 py-3 text-white">{result.exam.name}</td>
                  <td className="px-3 py-3 text-brand-muted">{result.exam.subject}</td>
                  <td className="px-3 py-3 text-brand-muted">{formatDate(result.exam.date)}</td>
                  <td className="px-3 py-3 text-white">
                    {result.marksObtained}/{result.exam.totalMarks}
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300">
                      {result.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
