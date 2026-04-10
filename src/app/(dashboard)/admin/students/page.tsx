import Link from "next/link";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatDate, getInitials } from "@/lib/utils";

type StudentsPageProps = {
  searchParams?: {
    search?: string;
    batchId?: string;
    status?: string;
    page?: string;
  };
};

export default async function AdminStudentsPage({ searchParams }: StudentsPageProps) {
  await requireRole("ADMIN");

  const page = Math.max(1, Number(searchParams?.page ?? "1"));
  const limit = 10;
  const search = searchParams?.search?.trim() ?? "";
  const batchId = searchParams?.batchId ?? "";
  const status = searchParams?.status ?? "";

  const batches = await prisma.batch.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  const students = await prisma.student.findMany({
    where: {
      ...(batchId ? { batchId } : {}),
      ...(search
        ? {
            OR: [
              { rollNo: { contains: search, mode: "insensitive" } },
              { user: { name: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      batch: {
        select: {
          name: true,
        },
      },
      attendance: {
        select: {
          status: true,
        },
      },
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });

  const enrichedStudents = students
    .map((student) => {
      const total = student.attendance.length;
      const present = student.attendance.filter((item) => item.status === "PRESENT").length;
      const percentage = total === 0 ? 0 : (present / total) * 100;
      const attendanceBand =
        percentage >= 75 ? "excellent" : percentage >= 60 ? "average" : "low";

      return {
        ...student,
        attendancePercentage: percentage,
        attendanceBand,
      };
    })
    .filter((student) => !status || student.attendanceBand === status);

  const total = enrichedStudents.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedStudents = enrichedStudents.slice((page - 1) * limit, page * limit);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Students</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Manage enrollments, attendance health, and student profiles.
          </p>
        </div>
        <Link
          href="/admin/students/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Enroll Student
        </Link>
      </div>

      <div className="premium-card rounded-3xl p-5">
        <form className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by name, roll no, or email"
              className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark pl-10 pr-4 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          <select
            name="batchId"
            defaultValue={batchId}
            className="h-11 rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
          >
            <option value="">All batches</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <select
              name="status"
              defaultValue={status}
              className="h-11 flex-1 rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="">All status bands</option>
              <option value="excellent">Excellent attendance</option>
              <option value="average">Average attendance</option>
              <option value="low">Low attendance</option>
            </select>
            <button
              type="submit"
              className="rounded-xl border border-brand-border px-4 text-sm text-white transition hover:border-violet-500"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      <div className="premium-card overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-brand-border bg-white/[0.02]">
              <tr className="text-sm text-brand-muted">
                <th className="px-5 py-4">#</th>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Roll No</th>
                <th className="px-5 py-4">Batch</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Enrolled</th>
                <th className="px-5 py-4">Att%</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className="border-b border-brand-border/70 text-sm transition hover:bg-[#16162A]"
                  >
                    <td className="px-5 py-4 text-brand-muted">{(page - 1) * limit + index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                          {getInitials(student.user.name)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{student.user.name}</p>
                          <p className="text-xs text-brand-muted">{student.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-white">{student.rollNo}</td>
                    <td className="px-5 py-4 text-brand-muted">{student.batch.name}</td>
                    <td className="px-5 py-4 text-brand-muted">{student.phone}</td>
                    <td className="px-5 py-4 text-brand-muted">{formatDate(student.enrolledAt)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          student.attendancePercentage >= 75
                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : student.attendancePercentage >= 60
                              ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                              : "border border-red-500/20 bg-red-500/10 text-red-400"
                        }`}
                      >
                        {student.attendancePercentage.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/students/${student.id}`}
                          aria-label={`View ${student.user.name}`}
                          className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-violet-500 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/students/${student.id}`}
                          aria-label={`Edit ${student.user.name}`}
                          className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-violet-500 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          aria-label={`Delete ${student.user.name}`}
                          className="rounded-xl border border-brand-border p-2 text-brand-muted transition hover:border-red-500 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-border bg-white/[0.03]">
                        <Search className="h-6 w-6 text-brand-muted" />
                      </div>
                      <h3 className="mt-4 font-outfit text-xl font-semibold text-white">No students found</h3>
                      <p className="mt-2 text-sm text-brand-muted">
                        Try adjusting the search terms or filters to find the student you need.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-brand-border px-5 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-brand-muted">
            Showing {total === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} students
          </p>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
              const query = new URLSearchParams();
              if (search) query.set("search", search);
              if (batchId) query.set("batchId", batchId);
              if (status) query.set("status", status);
              query.set("page", pageNumber.toString());

              return (
                <Link
                  key={pageNumber}
                  href={`/admin/students?${query.toString()}`}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm transition ${
                    pageNumber === page
                      ? "bg-violet-600 text-white"
                      : "border border-brand-border text-brand-muted hover:border-violet-500 hover:text-white"
                  }`}
                >
                  {pageNumber}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
