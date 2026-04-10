import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const createFacultySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  qualification: z.string().min(3),
  salary: z.number().positive(),
  subjects: z.array(z.string()).min(1),
});

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "FACULTY"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where =
    session.user.role === "FACULTY"
      ? {
          userId: session.user.id,
        }
      : undefined;

  const faculty = await prisma.faculty.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      batches: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  return NextResponse.json({
    faculty: faculty.map((item) => ({
      ...item,
      batchCount: item.batches.length,
    })),
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
  const parsed = createFacultySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const emailExists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (emailExists) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  const faculty = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        role: "FACULTY",
      },
    });

    return tx.faculty.create({
      data: {
        userId: user.id,
        subjects: parsed.data.subjects,
        qualification: parsed.data.qualification,
        salary: parsed.data.salary,
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

  return NextResponse.json({ faculty }, { status: 201 });
}
