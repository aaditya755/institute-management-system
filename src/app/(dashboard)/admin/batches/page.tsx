import Link from "next/link";
import { BookOpen, Pencil, Plus, Trash2, Users } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { getInitials, formatTime } from "@/lib/utils";

export default async function AdminBatchesPage() {
  await requireRole("ADMIN");

  const batches = await prisma.batch.findMany({
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
      students: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Batches</h1>
          <p className="mt-1 text-sm text-brand-muted">Create and manage teaching groups, schedules, and faculty assignments.</p>
        </div>
        <Link
          href="/admin/batches/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Create Batch
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {batches.map((batch) => (
          <article key={batch.id} className="premium-card top-accent-border rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-outfit text-2xl font-semibold text-white">{batch.name}</h2>
                <div className="mt-3 inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                  {batch.subject}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={`Edit ${batch.name}`}
                  className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-violet-500 hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${batch.name}`}
                  className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-red-500 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                {getInitials(batch.faculty.user.name)}
              </div>
              <div>
                <p className="text-sm text-brand-muted">Faculty</p>
                <p className="font-medium text-white">{batch.faculty.user.name}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {batch.days.map((day) => (
                <span
                  key={day}
                  className="rounded-full border border-brand-border px-2.5 py-1 text-xs text-brand-muted"
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs text-brand-muted">Time Slot</p>
                <p className="mt-2 text-white">
                  {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-xs text-brand-muted">
                  <Users className="h-4 w-4" />
                  Student Count
                </div>
                <p className="mt-2 text-white">{batch.students.length}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-brand-muted">
              <BookOpen className="h-4 w-4" />
              Structured for premium classroom delivery
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
