import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const createBatchSchema = z.object({
  name: z.string().min(2),
  subject: z.string().min(1),
  facultyId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  days: z.array(z.string()).min(1),
});

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where =
    session.user.role === "FACULTY"
      ? { faculty: { userId: session.user.id } }
      : session.user.role === "STUDENT"
        ? { students: { some: { userId: session.user.id } } }
        : undefined;

  const batches = await prisma.batch.findMany({
    where,
    include: {
      faculty: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      students: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    batches: batches.map((batch) => ({
      ...batch,
      studentCount: batch.students.length,
      facultyName: batch.faculty.user.name,
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
  const parsed = createBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const batch = await prisma.batch.create({
    data: parsed.data,
    include: {
      faculty: {
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

  return NextResponse.json({ batch }, { status: 201 });
}
