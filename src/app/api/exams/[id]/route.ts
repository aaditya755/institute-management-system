import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const updateExamSchema = z.object({
  name: z.string().min(2),
  batchId: z.string().min(1),
  facultyId: z.string().min(1),
  subject: z.string().min(1),
  date: z.string().min(1),
  totalMarks: z.number().positive(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: params.id },
    include: {
      batch: {
        select: {
          id: true,
          name: true,
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
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  return NextResponse.json({
    exam: {
      ...exam,
      resultsCount: exam.results.length,
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "FACULTY"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateExamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const exam = await prisma.exam.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  });

  return NextResponse.json({ exam });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "FACULTY"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.exam.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
