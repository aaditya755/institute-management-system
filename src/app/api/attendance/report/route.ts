import { NextRequest, NextResponse } from "next/server";
import { endOfMonth, startOfMonth } from "date-fns";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "FACULTY"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!batchId || Number.isNaN(month) || Number.isNaN(year)) {
    return NextResponse.json({ error: "batchId, month, and year are required" }, { status: 400 });
  }

  const date = new Date(year, month - 1, 1);

  const students = await prisma.student.findMany({
    where: {
      batchId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      attendance: {
        where: {
          date: {
            gte: startOfMonth(date),
            lte: endOfMonth(date),
          },
        },
      },
    },
  });

  const report = students.map((student) => {
    const present = student.attendance.filter((item) => item.status === "PRESENT").length;
    const absent = student.attendance.filter((item) => item.status === "ABSENT").length;
    const late = student.attendance.filter((item) => item.status === "LATE").length;
    const total = student.attendance.length;
    const percentage = total === 0 ? 0 : (present / total) * 100;

    return {
      studentId: student.id,
      name: student.user.name,
      rollNo: student.rollNo,
      present,
      absent,
      late,
      total,
      percentage,
    };
  });

  return NextResponse.json({ report });
}
