import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const createStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  rollNo: z.string().min(3),
  batchId: z.string().min(1),
  phone: z.string().min(10),
  parentPhone: z.string().min(10),
  address: z.string().min(8),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const batchId = searchParams.get("batchId") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.max(1, Number(searchParams.get("limit") ?? "10"));

  const where = {
    ...(batchId ? { batchId } : {}),
    ...(search
      ? {
          OR: [
            { rollNo: { contains: search, mode: "insensitive" as const } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        enrolledAt: "desc",
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
            name: true,
            subject: true,
          },
        },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({
    students,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
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
  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const rollExists = await prisma.student.findUnique({
    where: { rollNo: parsed.data.rollNo },
    select: { id: true },
  });
  if (rollExists) {
    return NextResponse.json({ error: "Roll number already exists" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  const student = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        role: "STUDENT",
      },
    });

    return tx.student.create({
      data: {
        userId: user.id,
        rollNo: parsed.data.rollNo,
        batchId: parsed.data.batchId,
        phone: parsed.data.phone,
        parentPhone: parsed.data.parentPhone,
        address: parsed.data.address,
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
            name: true,
            subject: true,
          },
        },
      },
    });
  });

  return NextResponse.json({ student }, { status: 201 });
}
