import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const updateFacultySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  qualification: z.string().min(3),
  salary: z.number().positive(),
  subjects: z.array(z.string()).min(1),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const faculty = await prisma.faculty.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      batches: true,
      exams: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!faculty) {
    return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
  }

  return NextResponse.json({
    faculty: {
      ...faculty,
      examCount: faculty.exams.length,
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
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateFacultySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.faculty.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
  }

  const faculty = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
      },
    });

    return tx.faculty.update({
      where: { id: params.id },
      data: {
        qualification: parsed.data.qualification,
        salary: parsed.data.salary,
        subjects: parsed.data.subjects,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  });

  return NextResponse.json({ faculty });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.faculty.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
  }

  await prisma.user.delete({
    where: { id: existing.userId },
  });

  return NextResponse.json({ success: true });
}
