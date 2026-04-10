import { NextRequest, NextResponse } from "next/server";
import { endOfMonth, startOfMonth } from "date-fns";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const bulkAttendanceSchema = z.object({
  batchId: z.string().min(1),
  date: z.string().min(1),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    }),
  ),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");
  const date = searchParams.get("date");
  const studentId = searchParams.get("studentId");
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (batchId && date) {
    if (!["ADMIN", "FACULTY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const day = new Date(date);
    day.setHours(0, 0, 0, 0);

    const nextDay = new Date(day);
    nextDay.setHours(23, 59, 59, 999);

    const attendance = await prisma.attendance.findMany({
      where: {
        batchId,
        date: {
          gte: day,
          lte: nextDay,
        },
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
    });

    return NextResponse.json({ attendance });
  }

  if (!Number.isNaN(month) && !Number.isNaN(year)) {
    let resolvedStudentId = studentId;

    if (session.user.role === "STUDENT") {
      const me = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      resolvedStudentId = me?.id ?? "";
    } else if (!resolvedStudentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const baseDate = new Date(year, month - 1, 1);
    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: resolvedStudentId,
        date: {
          gte: startOfMonth(baseDate),
          lte: endOfMonth(baseDate),
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json({ attendance });
  }

  return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "FACULTY"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bulkAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const attendanceDate = new Date(parsed.data.date);
  attendanceDate.setHours(0, 0, 0, 0);

  const results = await prisma.$transaction(
    parsed.data.records.map((record) =>
      prisma.attendance.upsert({
        where: {
          studentId_batchId_date: {
            studentId: record.studentId,
            batchId: parsed.data.batchId,
            date: attendanceDate,
          },
        },
        update: {
          status: record.status,
        },
        create: {
          studentId: record.studentId,
          batchId: parsed.data.batchId,
          date: attendanceDate,
          status: record.status,
        },
      }),
    ),
  );

  return NextResponse.json({ count: results.length });
}
