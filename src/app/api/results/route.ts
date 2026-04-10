import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";
import { calculateGrade } from "@/lib/utils";

const bulkResultsSchema = z.object({
  examId: z.string().min(1),
  results: z.array(
    z.object({
      studentId: z.string().min(1),
      marksObtained: z.number().min(0),
      remarks: z.string().optional(),
    }),
  ),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId");
  const studentId = searchParams.get("studentId");

  if (examId) {
    const results = await prisma.result.findMany({
      where: { examId },
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
        student: {
          rollNo: "asc",
        },
      },
    });

    return NextResponse.json({ results });
  }

  let resolvedStudentId = studentId;
  if (session.user.role === "STUDENT") {
    const me = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    resolvedStudentId = me?.id ?? "";
  }

  if (resolvedStudentId) {
    const results = await prisma.result.findMany({
      where: { studentId: resolvedStudentId },
      include: {
        exam: {
          select: {
            name: true,
            subject: true,
            date: true,
            totalMarks: true,
          },
        },
      },
      orderBy: {
        exam: {
          date: "desc",
        },
      },
    });

    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: "examId or studentId is required" }, { status: 400 });
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
  const parsed = bulkResultsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: parsed.data.examId },
    select: { totalMarks: true },
  });
  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  const results = await prisma.$transaction(
    parsed.data.results.map((result) =>
      prisma.result.upsert({
        where: {
          examId_studentId: {
            examId: parsed.data.examId,
            studentId: result.studentId,
          },
        },
        update: {
          marksObtained: result.marksObtained,
          grade: calculateGrade(result.marksObtained, exam.totalMarks),
          remarks: result.remarks,
        },
        create: {
          examId: parsed.data.examId,
          studentId: result.studentId,
          marksObtained: result.marksObtained,
          grade: calculateGrade(result.marksObtained, exam.totalMarks),
          remarks: result.remarks,
        },
      }),
    ),
  );

  return NextResponse.json({ results, count: results.length });
}
