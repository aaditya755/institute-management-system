import { notFound } from "next/navigation";
import { CheckCircle2, CreditCard, FileBarChart2, GraduationCap, Trash2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import {
  formatCurrency,
  formatDate,
  getAttendanceColor,
  getInitials,
} from "@/lib/utils";

type StudentDetailsPageProps = {
  params: {
    id: string;
  };
};

export default async function StudentDetailsPage({ params }: StudentDetailsPageProps) {
  await requireRole("ADMIN");

  const student = await prisma.student.findUnique({
    where: {
      id: params.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
      batch: {
        select: {
          name: true,
          subject: true,
        },
      },
      attendance: {
        orderBy: {
          date: "desc",
        },
        take: 30,
      },
      fees: {
        orderBy: {
          installmentNo: "asc",
        },
      },
      results: {
        include: {
          exam: {
            select: {
              name: true,
              subject: true,
              totalMarks: true,
              date: true,
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
    notFound();
  }

  const attendanceTotal = student.attendance.length;
  const presentCount = student.attendance.filter((item) => item.status === "PRESENT").length;
  const attendancePercentage = attendanceTotal === 0 ? 0 : (presentCount / attendanceTotal) * 100;
  const feesPaid = student.fees
    .filter((fee) => fee.status === "PAID")
    .reduce((sum, fee) => sum + fee.amount, 0);
  const examsTaken = student.results.length;
  const lastGrade = student.results[0]?.grade ?? "N/A";

  return (
    <section className="space-y-6">
      <div className="premium-card rounded-3xl p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-600 text-2xl font-semibold text-white">
              {getInitials(student.user.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-outfit text-3xl font-semibold text-white">{student.user.name}</h1>
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                  {student.batch.name}
                </span>
              </div>
              <p className="mt-2 text-sm text-brand-muted">
                Roll No {student.rollNo} · Enrolled {formatDate(student.enrolledAt)}
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                {student.user.email} · {student.phone}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Attendance", value: `${attendancePercentage.toFixed(0)}%`, icon: CheckCircle2 },
              { label: "Fees Paid", value: formatCurrency(feesPaid), icon: CreditCard },
              { label: "Exams Taken", value: examsTaken.toString(), icon: FileBarChart2 },
              { label: "Last Grade", value: lastGrade, icon: GraduationCap },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-brand-border bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-brand-muted">
                    <Icon className="h-4 w-4" />
                    {stat.label}
                  </div>
                  <div className="mt-2 font-outfit text-xl font-semibold text-white">{stat.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="premium-card rounded-3xl p-6 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-outfit text-xl font-semibold text-white">Overview</h2>
              <p className="text-sm text-brand-muted">Personal and academic details</p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-brand-border px-3 py-2 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
            >
              Edit
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-brand-muted">Parent Phone</p>
              <p className="mt-1 text-white">{student.parentPhone}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-brand-muted">Address</p>
              <p className="mt-1 text-white">{student.address}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-brand-muted">Subject Track</p>
              <p className="mt-1 text-white">{student.batch.subject}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="premium-card rounded-3xl p-6">
            <h2 className="font-outfit text-xl font-semibold text-white">Attendance</h2>
            <p className="mt-1 text-sm text-brand-muted">Monthly summary and latest 30 days.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                <p className="text-xs text-emerald-300">Present</p>
                <p className="mt-2 font-outfit text-2xl text-white">{presentCount}</p>
              </div>
              <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
                <p className="text-xs text-red-300">Absent</p>
                <p className="mt-2 font-outfit text-2xl text-white">
                  {student.attendance.filter((item) => item.status === "ABSENT").length}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
                <p className="text-xs text-amber-300">Late</p>
                <p className="mt-2 font-outfit text-2xl text-white">
                  {student.attendance.filter((item) => item.status === "LATE").length}
                </p>
              </div>
              <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                <p className="text-xs text-violet-300">Percentage</p>
                <p className="mt-2 font-outfit text-2xl text-white">{attendancePercentage.toFixed(0)}%</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {student.attendance.map((item) => (
                <span
                  key={item.id}
                  className={`rounded-full border px-3 py-1 text-xs ${getAttendanceColor(item.status)}`}
                >
                  {formatDate(item.date)} · {item.status}
                </span>
              ))}
            </div>
          </div>

          <div className="premium-card rounded-3xl p-6">
            <h2 className="font-outfit text-xl font-semibold text-white">Fees</h2>
            <p className="mt-1 text-sm text-brand-muted">Installment timeline and payment progress.</p>
            <div className="mt-5 space-y-4">
              {student.fees.map((fee) => (
                <div key={fee.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-brand-border px-2.5 py-1 text-xs text-brand-muted">
                          Installment {fee.installmentNo}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            fee.status === "PAID"
                              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : fee.status === "PARTIAL"
                                ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                                : "border border-red-500/20 bg-red-500/10 text-red-400"
                          }`}
                        >
                          {fee.status}
                        </span>
                      </div>
                      <p className="mt-3 font-medium text-white">{fee.description ?? "Tuition fee installment"}</p>
                      <p className="mt-1 text-sm text-brand-muted">
                        Due {formatDate(fee.dueDate)}
                        {fee.paidDate ? ` · Paid ${formatDate(fee.paidDate)}` : ""}
                      </p>
                    </div>
                    <div className="font-outfit text-2xl font-semibold text-white">{formatCurrency(fee.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card rounded-3xl p-6">
            <h2 className="font-outfit text-xl font-semibold text-white">Results</h2>
            <p className="mt-1 text-sm text-brand-muted">Exam performance and remarks.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-brand-border text-brand-muted">
                  <tr>
                    <th className="px-3 py-3">Exam</th>
                    <th className="px-3 py-3">Subject</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Marks</th>
                    <th className="px-3 py-3">Grade</th>
                    <th className="px-3 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {student.results.map((result) => (
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
                      <td className="px-3 py-3 text-brand-muted">{result.remarks ?? "No remarks"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card rounded-3xl border border-red-500/15 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-outfit text-xl font-semibold text-white">Delete Student</h2>
            <p className="mt-1 text-sm text-brand-muted">
              For safety, type <span className="font-mono text-white">{student.user.name}</span> in the final dialog before deleting.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
          >
            <Trash2 className="h-4 w-4" />
            Delete Student
          </button>
        </div>
      </div>
    </section>
  );
}
