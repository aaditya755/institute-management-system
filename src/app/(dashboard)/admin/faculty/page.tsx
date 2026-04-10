import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

export default async function AdminFacultyPage() {
  await requireRole("ADMIN");

  const facultyMembers = await prisma.faculty.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      batches: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Faculty</h1>
          <p className="mt-1 text-sm text-brand-muted">Manage teaching staff, subjects, and assigned batches.</p>
        </div>
        <Link
          href="/admin/faculty/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Faculty
        </Link>
      </div>

      <div className="premium-card overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-border bg-white/[0.02] text-brand-muted">
              <tr>
                <th className="px-5 py-4">Faculty</th>
                <th className="px-5 py-4">Subjects</th>
                <th className="px-5 py-4">Qualification</th>
                <th className="px-5 py-4">Salary</th>
                <th className="px-5 py-4">Batches</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {facultyMembers.map((faculty) => (
                <tr key={faculty.id} className="border-b border-brand-border/60 hover:bg-[#16162A]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                        {getInitials(faculty.user.name)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{faculty.user.name}</p>
                        <p className="text-xs text-brand-muted">{faculty.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {faculty.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-brand-muted">{faculty.qualification}</td>
                  <td className="px-5 py-4 text-white">{formatCurrency(faculty.salary)}</td>
                  <td className="px-5 py-4 text-brand-muted">{faculty.batches.length}</td>
                  <td className="px-5 py-4 text-brand-muted">{formatDate(faculty.joinedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/faculty/${faculty.id}`}
                        aria-label={`View ${faculty.user.name}`}
                        className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-violet-500 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/faculty/${faculty.id}`}
                        aria-label={`Edit ${faculty.user.name}`}
                        className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-violet-500 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Delete ${faculty.user.name}`}
                        className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-red-500 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
