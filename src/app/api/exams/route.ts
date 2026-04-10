import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const createExamSchema = z.object({
  name: z.string().min(2),
  batchId: z.string().min(1),
  facultyId: z.string().optional(),
  subject: z.string().min(1),
  date: z.string().min(1),
  totalMarks: z.number().positive(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");
  const facultyId = searchParams.get("facultyId");

  let where:
    | {
        batchId?: string;
        facultyId?: string;
        faculty?: { userId: string };
        batch?: { students: { some: { userId: string } } };
      }
    | undefined;

  if (session.user.role === "FACULTY") {
    where = { faculty: { userId: session.user.id } };
  } else if (session.user.role === "STUDENT") {
    where = { batch: { students: { some: { userId: session.user.id } } } };
  } else {
    where = {
      ...(batchId ? { batchId } : {}),
      ...(facultyId ? { facultyId } : {}),
    };
  }

  const exams = await prisma.exam.findMany({
    where,
    include: {
      batch: {
        include: {
          students: {
            select: {
              id: true,
              rollNo: true,
              user: {
                select: {
                  name: true,
                },
              },
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
          studentId: true,
          marksObtained: true,
          remarks: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json({ exams });
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
  const parsed = createExamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let resolvedFacultyId = parsed.data.facultyId;
  if (session.user.role === "FACULTY") {
    const faculty = await prisma.faculty.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    resolvedFacultyId = faculty?.id;
  }

  if (!resolvedFacultyId) {
    return NextResponse.json({ error: "facultyId is required" }, { status: 400 });
  }

  const exam = await prisma.exam.create({
    data: {
      name: parsed.data.name,
      batchId: parsed.data.batchId,
      facultyId: resolvedFacultyId,
      subject: parsed.data.subject,
      date: new Date(parsed.data.date),
      totalMarks: parsed.data.totalMarks,
    },
  });

  return NextResponse.json({ exam }, { status: 201 });
}
