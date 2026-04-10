import { notFound } from "next/navigation";
import { BookOpen, BriefcaseBusiness, IndianRupee, Pencil } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

type FacultyDetailsPageProps = {
  params: {
    id: string;
  };
};

export default async function FacultyDetailsPage({ params }: FacultyDetailsPageProps) {
  await requireRole("ADMIN");

  const faculty = await prisma.faculty.findUnique({
    where: {
      id: params.id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
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
      exams: {
        select: {
          id: true,
          name: true,
          date: true,
        },
      },
    },
  });

  if (!faculty) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="premium-card rounded-3xl p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-600 text-2xl font-semibold text-white">
              {getInitials(faculty.user.name)}
            </div>
            <div>
              <h1 className="font-outfit text-3xl font-semibold text-white">{faculty.user.name}</h1>
              <p className="mt-2 text-sm text-brand-muted">{faculty.user.email}</p>
              <p className="mt-1 text-sm text-brand-muted">
                Joined {formatDate(faculty.joinedAt)} · {faculty.qualification}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
          >
            <Pencil className="h-4 w-4" />
            Edit Faculty
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="premium-card rounded-3xl p-6 xl:col-span-1">
          <h2 className="font-outfit text-xl font-semibold text-white">Profile</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-xs text-brand-muted">
                <BriefcaseBusiness className="h-4 w-4" />
                Qualification
              </div>
              <p className="mt-2 text-white">{faculty.qualification}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-xs text-brand-muted">
                <IndianRupee className="h-4 w-4" />
                Salary
              </div>
              <p className="mt-2 text-white">{formatCurrency(faculty.salary)}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-xs text-brand-muted">
                <BookOpen className="h-4 w-4" />
                Subjects
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {faculty.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="premium-card rounded-3xl p-6">
            <h2 className="font-outfit text-xl font-semibold text-white">Assigned Batches</h2>
            <p className="mt-1 text-sm text-brand-muted">Current teaching groups managed by this faculty member.</p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {faculty.batches.map((batch) => (
                <div key={batch.id} className="top-accent-border rounded-3xl border border-brand-border bg-white/[0.02] p-5">
                  <h3 className="font-outfit text-lg font-semibold text-white">{batch.name}</h3>
                  <p className="mt-2 text-sm text-brand-muted">
                    {batch.subject} · {batch.startTime} - {batch.endTime}
                  </p>
                  <p className="mt-3 text-sm text-brand-muted">{batch.students.length} students enrolled</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {batch.days.map((day) => (
                      <span
                        key={day}
                        className="rounded-full border border-brand-border px-2.5 py-1 text-xs text-brand-muted"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card rounded-3xl p-6">
            <h2 className="font-outfit text-xl font-semibold text-white">Salary History</h2>
            <p className="mt-1 text-sm text-brand-muted">Static summary card for now, ready for payroll history later.</p>
            <div className="mt-5 rounded-3xl border border-amber-500/15 bg-amber-500/5 p-5">
              <p className="text-sm text-amber-200">
                Compensation has remained stable this academic cycle at{" "}
                <span className="font-semibold text-white">{formatCurrency(faculty.salary)}</span> per month.
              </p>
              <p className="mt-2 text-sm text-brand-muted">
                Last reviewed on {formatDate(faculty.joinedAt)}. Payroll trend history can be added in a later iteration.
              </p>
            </div>
          </div>

          <div className="premium-card rounded-3xl p-6">
            <h2 className="font-outfit text-xl font-semibold text-white">Exam Activity</h2>
            <p className="mt-1 text-sm text-brand-muted">Recent examinations scheduled under this faculty member.</p>
            <div className="mt-5 space-y-3">
              {faculty.exams.map((exam) => (
                <div key={exam.id} className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{exam.name}</p>
                      <p className="text-sm text-brand-muted">{formatDate(exam.date)}</p>
                    </div>
                    <span className="rounded-full border border-brand-border px-2.5 py-1 text-xs text-brand-muted">
                      Scheduled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
