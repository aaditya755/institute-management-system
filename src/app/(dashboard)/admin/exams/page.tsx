import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/utils";

export default async function AdminExamsPage() {
  await requireRole("ADMIN");

  const exams = await prisma.exam.findMany({
    include: {
      batch: {
        include: {
          students: {
            select: {
              id: true,
            },
          },
        },
      },
      faculty: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      results: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Examinations</h1>
          <p className="mt-1 text-sm text-brand-muted">Schedule exams, monitor result completion, and manage assessment cycles.</p>
        </div>
        <Link
          href="/admin/exams/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Schedule Exam
        </Link>
      </div>

      <div className="premium-card overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-border bg-white/[0.02] text-brand-muted">
              <tr>
                <th className="px-5 py-4">Exam Name</th>
                <th className="px-5 py-4">Batch</th>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Total Marks</th>
                <th className="px-5 py-4">Results</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => {
                const totalStudents = exam.batch.students.length;
                const entered = exam.results.length;
                const statusLabel =
                  entered === 0
                    ? "Pending"
                    : entered < totalStudents
                      ? `${entered}/${totalStudents} entered`
                      : "Complete";

                return (
                  <tr key={exam.id} className="border-b border-brand-border/60 hover:bg-[#16162A]">
                    <td className="px-5 py-4 text-white">{exam.name}</td>
                    <td className="px-5 py-4 text-brand-muted">{exam.batch.name}</td>
                    <td className="px-5 py-4 text-brand-muted">{exam.subject}</td>
                    <td className="px-5 py-4 text-brand-muted">{formatDate(exam.date)}</td>
                    <td className="px-5 py-4 text-white">{exam.totalMarks}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          entered === 0
                            ? "border border-red-500/20 bg-red-500/10 text-red-400"
                            : entered < totalStudents
                              ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                              : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/results?examId=${exam.id}`}
                          className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-violet-500 hover:text-white"
                          aria-label={`View results for ${exam.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-violet-500 hover:text-white"
                          aria-label={`Edit ${exam.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-red-500 hover:text-red-300"
                          aria-label={`Delete ${exam.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
