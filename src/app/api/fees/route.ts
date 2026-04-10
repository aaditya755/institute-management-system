import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const createFeeSchema = z.object({
  studentId: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().min(1),
  installmentNo: z.number().int().positive(),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const status = searchParams.get("status");

  let resolvedStudentId = studentId;

  if (session.user.role === "STUDENT") {
    const me = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    resolvedStudentId = me?.id ?? "";
  } else if (!resolvedStudentId && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.user.role === "ADMIN" || resolvedStudentId) {
    const fees = await prisma.fee.findMany({
      where: {
        ...(resolvedStudentId ? { studentId: resolvedStudentId } : {}),
        ...(status ? { status: status as "PAID" | "UNPAID" | "PARTIAL" } : {}),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json({ fees });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createFeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const fee = await prisma.fee.create({
    data: {
      studentId: parsed.data.studentId,
      amount: parsed.data.amount,
      dueDate: new Date(parsed.data.dueDate),
      installmentNo: parsed.data.installmentNo,
      description: parsed.data.description,
    },
  });

  return NextResponse.json({ fee }, { status: 201 });
}
