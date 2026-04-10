import { BookOpen, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatDate, formatTime, getGreeting } from "@/lib/utils";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function FacultyDashboardPage() {
  const session = await requireRole("FACULTY");

  const faculty = await prisma.faculty.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      batches: {
        include: {
          students: {
            select: {
              id: true,
            },
          },
        },
      },
      timetables: true,
      exams: true,
    },
  });

  if (!faculty) {
    return null;
  }

  const todayLabel = days[new Date().getDay()];
  const todaysClasses = faculty.timetables.filter((item) => item.day === todayLabel);
  const currentMonth = new Date().getMonth();
  const examsThisMonth = faculty.exams.filter((exam) => new Date(exam.date).getMonth() === currentMonth).length;
  const myStudents = faculty.batches.reduce((sum, batch) => sum + batch.students.length, 0);

  const recentAttendance = await prisma.attendance.groupBy({
    by: ["batchId", "date"],
    where: {
      batchId: {
        in: faculty.batches.map((batch) => batch.id),
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 3,
  });

  const batchNames = new Map(faculty.batches.map((batch) => [batch.id, batch.name]));

  return (
    <section className="space-y-6">
      <div className="premium-card rounded-3xl p-6">
        <h1 className="font-outfit text-3xl font-semibold text-white">
          {getGreeting()}, {faculty.user.name} 👋
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Here&apos;s a quick view of your classes, teaching load, and recent attendance activity.
        </p>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <div className="mb-5">
          <h2 className="font-outfit text-xl font-semibold text-white">Today&apos;s Classes</h2>
          <p className="text-sm text-brand-muted">Scheduled sessions for {format(new Date(), "EEEE")}.</p>
        </div>

        {todaysClasses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {todaysClasses.map((slot) => {
              const batch = faculty.batches.find((item) => item.id === slot.batchId);
              return (
                <div key={slot.id} className="top-accent-border rounded-3xl border border-brand-border bg-white/[0.02] p-5">
                  <p className="font-outfit text-xl font-semibold text-white">{slot.subject}</p>
                  <p className="mt-2 text-sm text-brand-muted">{batch?.name ?? "Batch"}</p>
                  <p className="mt-3 text-sm text-white">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </p>
                  <p className="mt-2 text-sm text-brand-muted">{batch?.students.length ?? 0} students</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-brand-border bg-white/[0.02] p-6 text-sm text-brand-muted">
            No classes today · Enjoy your day!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card rounded-3xl p-5">
          <div className="flex items-center gap-3 text-violet-300">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm">My Batches</span>
          </div>
          <p className="mt-4 font-outfit text-3xl font-semibold text-white">{faculty.batches.length}</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <div className="flex items-center gap-3 text-amber-300">
            <Users className="h-5 w-5" />
            <span className="text-sm">Students I Teach</span>
          </div>
          <p className="mt-4 font-outfit text-3xl font-semibold text-white">{myStudents}</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <div className="flex items-center gap-3 text-emerald-300">
            <FileText className="h-5 w-5" />
            <span className="text-sm">Exams This Month</span>
          </div>
          <p className="mt-4 font-outfit text-3xl font-semibold text-white">{examsThisMonth}</p>
        </div>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <h2 className="font-outfit text-xl font-semibold text-white">Recent Attendance</h2>
        <p className="mt-1 text-sm text-brand-muted">Last three attendance sessions you managed.</p>
        <div className="mt-5 space-y-3">
          {recentAttendance.map((sessionItem) => (
            <div key={`${sessionItem.batchId}-${sessionItem.date.toISOString()}`} className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{batchNames.get(sessionItem.batchId) ?? "Batch"}</p>
                  <p className="text-sm text-brand-muted">{formatDate(sessionItem.date)}</p>
                </div>
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300">
                  {sessionItem._count.id} recorded
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
