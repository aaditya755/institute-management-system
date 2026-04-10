import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const updateStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  parentPhone: z.string().min(10),
  address: z.string().min(8),
  batchId: z.string().min(1),
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

  const student = await prisma.student.findUnique({
    where: { id: params.id },
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
          id: true,
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
          dueDate: "asc",
        },
      },
      results: {
        include: {
          exam: {
            select: {
              id: true,
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
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const feeSummary = {
    total: student.fees.reduce((sum, fee) => sum + fee.amount, 0),
    paid: student.fees.filter((fee) => fee.status === "PAID").reduce((sum, fee) => sum + fee.amount, 0),
    pending: student.fees.filter((fee) => fee.status !== "PAID").reduce((sum, fee) => sum + fee.amount, 0),
  };

  return NextResponse.json({ student, feeSummary });
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
  const parsed = updateStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.student.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const student = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
      },
    });

    return tx.student.update({
      where: { id: params.id },
      data: {
        phone: parsed.data.phone,
        parentPhone: parsed.data.parentPhone,
        address: parsed.data.address,
        batchId: parsed.data.batchId,
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
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });
  });

  return NextResponse.json({ student });
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

  const existing = await prisma.student.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  await prisma.user.delete({
    where: { id: existing.userId },
  });

  return NextResponse.json({ success: true });
}
