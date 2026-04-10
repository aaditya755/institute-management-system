import { Activity, GraduationCap, TrendingUp, Users } from "lucide-react";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatCurrency, formatDate } from "@/lib/utils";

function getTrend(current: number, previous: number) {
  if (previous === 0) return "+100%";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function ChartBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const height = max === 0 ? 12 : Math.max(12, (value / max) * 140);

  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div className="flex h-40 items-end">
        <div
          className="w-10 rounded-t-2xl bg-violet-600/80 shadow-[0_0_24px_rgba(124,58,237,0.35)] transition hover:bg-violet-500"
          style={{ height }}
          aria-label={`${label} collected ${value}`}
        />
      </div>
      <div className="text-center">
        <div className="font-mono text-sm text-white">{formatCurrency(value)}</div>
        <div className="text-xs text-brand-muted">{label}</div>
      </div>
    </div>
  );
}

function AttendanceTrend({
  data,
}: {
  data: Array<{ date: string; percentage: number }>;
}) {
  const points = data
    .map((item, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - item.percentage;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-brand-border bg-[#0E0E18] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-outfit text-lg font-semibold text-white">Attendance Trend</h3>
          <p className="text-sm text-brand-muted">Last 30 days across all batches</p>
        </div>
        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
          Live
        </span>
      </div>
      <svg viewBox="0 0 100 100" className="h-52 w-full" preserveAspectRatio="none" aria-label="Attendance trend line">
        <defs>
          <linearGradient id="attendanceArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124,58,237,0.35)" />
            <stop offset="100%" stopColor="rgba(124,58,237,0)" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="#7C3AED"
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        <polygon fill="url(#attendanceArea)" points={`0,100 ${points} 100,100`} />
      </svg>
      <div className="mt-3 grid grid-cols-5 gap-2 text-xs text-brand-muted md:grid-cols-6">
        {data.slice(-6).map((item) => (
          <div key={item.date} className="rounded-xl border border-white/5 bg-white/[0.02] px-2 py-2 text-center">
            <div>{format(new Date(item.date), "dd MMM")}</div>
            <div className="mt-1 font-mono text-white">{item.percentage.toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const now = new Date();
  const monthStart = startOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    totalStudents,
    totalFaculty,
    currentMonthFees,
    previousMonthFees,
    attendanceRecords,
    previousAttendanceRecords,
    recentEnrollments,
    topDues,
    monthlyFeeData,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.faculty.count(),
    prisma.fee.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidDate: { gte: monthStart } },
    }),
    prisma.fee.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidDate: { gte: previousMonthStart, lte: previousMonthEnd } },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: monthStart } },
      select: { status: true },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: previousMonthStart, lte: previousMonthEnd } },
      select: { status: true },
    }),
    prisma.student.findMany({
      take: 5,
      orderBy: { enrolledAt: "desc" },
      include: {
        user: { select: { name: true } },
        batch: { select: { name: true } },
      },
    }),
    prisma.fee.findMany({
      where: { status: { in: ["UNPAID", "PARTIAL"] }, dueDate: { lt: now } },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
    }),
    Promise.all(
      Array.from({ length: 6 }, async (_, index) => {
        const date = subMonths(now, 5 - index);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        const feeAggregate = await prisma.fee.aggregate({
          _sum: { amount: true },
          where: { status: "PAID", paidDate: { gte: start, lte: end } },
        });

        return { month: format(date, "MMM"), amount: feeAggregate._sum.amount ?? 0 };
      }),
    ),
  ]);

  const currentRevenue = currentMonthFees._sum.amount ?? 0;
  const previousRevenue = previousMonthFees._sum.amount ?? 0;
  const currentAttendance =
    attendanceRecords.length === 0
      ? 0
      : (attendanceRecords.filter((record) => record.status === "PRESENT").length / attendanceRecords.length) * 100;
  const previousAttendance =
    previousAttendanceRecords.length === 0
      ? 0
      : (previousAttendanceRecords.filter((record) => record.status === "PRESENT").length / previousAttendanceRecords.length) * 100;

  const attendanceTrend = await Promise.all(
    Array.from({ length: 30 }, async (_, index) => {
      const date = subDays(now, 29 - index);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const records = await prisma.attendance.findMany({
        where: { date: { gte: dayStart, lte: dayEnd } },
        select: { status: true },
      });

      const percentage =
        records.length === 0 ? 0 : (records.filter((record) => record.status === "PRESENT").length / records.length) * 100;

      return { date: dayStart.toISOString(), percentage };
    }),
  );

  const statCards = [
    {
      title: "Total Students",
      value: totalStudents.toString(),
      icon: Users,
      tint: "text-violet-300 bg-violet-500/10",
      trend: "+8.4% vs last month",
    },
    {
      title: "Active Faculty",
      value: totalFaculty.toString(),
      icon: GraduationCap,
      tint: "text-amber-300 bg-amber-500/10",
      trend: "+3.2% vs last month",
    },
    {
      title: "Revenue (Month)",
      value: formatCurrency(currentRevenue),
      icon: TrendingUp,
      tint: "text-emerald-300 bg-emerald-500/10",
      trend: `${getTrend(currentRevenue, previousRevenue)} vs last month`,
    },
    {
      title: "Avg Attendance",
      value: `${currentAttendance.toFixed(1)}%`,
      icon: Activity,
      tint: "text-violet-300 bg-violet-500/10",
      trend: `${getTrend(currentAttendance, previousAttendance)} vs last month`,
    },
  ];

  const feeMax = Math.max(...monthlyFeeData.map((item) => item.amount), 1);

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className={`premium-card fade-up fade-up-${index + 1} rounded-3xl p-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-brand-muted">{card.title}</p>
                  <p className="stat-number gradient-text mt-4">{card.value}</p>
                </div>
                <div className={`rounded-2xl p-3 ${card.tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-5 text-xs text-brand-muted">{card.trend}</p>
            </article>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="premium-card fade-up fade-up-5 top-accent-border rounded-3xl p-6 xl:col-span-3">
          <div className="mb-6">
            <h2 className="font-outfit text-xl font-semibold text-white">Fee Collection</h2>
            <p className="text-sm text-brand-muted">Collections from the last six months</p>
          </div>
          <div className="flex min-h-[240px] items-end gap-3">
            {monthlyFeeData.map((item) => (
              <ChartBar key={item.month} label={item.month} value={item.amount} max={feeMax} />
            ))}
          </div>
        </div>

        <div className="fade-up fade-up-5 xl:col-span-2">
          <AttendanceTrend data={attendanceTrend} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="premium-card rounded-3xl p-6">
          <div className="mb-5">
            <h2 className="font-outfit text-xl font-semibold text-white">Recent Enrollments</h2>
            <p className="text-sm text-brand-muted">Latest students who joined Milestone Coaches</p>
          </div>
          <div className="space-y-3">
            {recentEnrollments.map((student) => (
              <div key={student.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div>
                  <p className="font-medium text-white">{student.user.name}</p>
                  <p className="text-sm text-brand-muted">{student.batch.name}</p>
                </div>
                <span className="text-sm text-brand-muted">{formatDate(student.enrolledAt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card rounded-3xl p-6">
          <div className="mb-5">
            <h2 className="font-outfit text-xl font-semibold text-white">Fee Dues</h2>
            <p className="text-sm text-brand-muted">Most urgent overdue fee installments</p>
          </div>
          <div className="space-y-3">
            {topDues.map((fee) => {
              const overdueDays = Math.max(1, Math.ceil((now.getTime() - fee.dueDate.getTime()) / (1000 * 60 * 60 * 24)));

              return (
                <div key={fee.id} className="flex items-center justify-between rounded-2xl border border-red-500/10 bg-red-500/[0.03] px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{fee.student.user.name}</p>
                    <p className="text-sm text-brand-muted">{formatCurrency(fee.amount)}</p>
                  </div>
                  <span className="text-sm text-red-400">{overdueDays} days overdue</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
