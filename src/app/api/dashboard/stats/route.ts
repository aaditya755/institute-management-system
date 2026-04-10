import { NextResponse } from "next/server";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const monthStart = startOfMonth(now);

  const [
    totalStudents,
    totalFaculty,
    totalBatches,
    monthlyRevenueAggregate,
    currentAttendance,
    recentEnrollmentsRaw,
    topDuesRaw,
    monthlyFeeData,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.faculty.count(),
    prisma.batch.count(),
    prisma.fee.aggregate({
      _sum: { amount: true },
      where: {
        status: "PAID",
        paidDate: {
          gte: monthStart,
        },
      },
    }),
    prisma.attendance.findMany({
      where: {
        date: {
          gte: monthStart,
        },
      },
      select: {
        status: true,
      },
    }),
    prisma.student.findMany({
      take: 5,
      orderBy: {
        enrolledAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        batch: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.fee.findMany({
      where: {
        status: {
          in: ["UNPAID", "PARTIAL"],
        },
        dueDate: {
          lt: now,
        },
      },
      take: 5,
      orderBy: {
        dueDate: "asc",
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    Promise.all(
      Array.from({ length: 6 }, async (_, index) => {
        const date = subMonths(now, 5 - index);
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const aggregate = await prisma.fee.aggregate({
          _sum: { amount: true },
          where: {
            status: "PAID",
            paidDate: {
              gte: start,
              lte: end,
            },
          },
        });

        return {
          month: format(date, "MMM"),
          amount: aggregate._sum.amount ?? 0,
        };
      }),
    ),
  ]);

  const attendanceTrend = await Promise.all(
    Array.from({ length: 30 }, async (_, index) => {
      const date = subDays(now, 29 - index);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const records = await prisma.attendance.findMany({
        where: {
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: {
          status: true,
        },
      });

      const percentage =
        records.length === 0
          ? 0
          : (records.filter((record) => record.status === "PRESENT").length / records.length) * 100;

      return {
        date: format(dayStart, "dd MMM"),
        percentage,
      };
    }),
  );

  return NextResponse.json({
    totalStudents,
    totalFaculty,
    totalBatches,
    monthlyRevenue: monthlyRevenueAggregate._sum.amount ?? 0,
    avgAttendance:
      currentAttendance.length === 0
        ? 0
        : (currentAttendance.filter((record) => record.status === "PRESENT").length / currentAttendance.length) * 100,
    recentEnrollments: recentEnrollmentsRaw.map((student) => ({
      name: student.user.name,
      batch: student.batch.name,
      enrolledAt: student.enrolledAt,
    })),
    topDues: topDuesRaw.map((fee) => ({
      studentName: fee.student.user.name,
      amount: fee.amount,
      dueDate: fee.dueDate,
    })),
    monthlyFeeData,
    attendanceTrend,
  });
}
