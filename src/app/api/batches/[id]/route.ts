import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const updateBatchSchema = z.object({
  name: z.string().min(2),
  subject: z.string().min(1),
  facultyId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  days: z.array(z.string()).min(1),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = await prisma.batch.findUnique({
    where: { id: params.id },
    include: {
      faculty: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      students: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      timetables: {
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json({ batch });
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
  const parsed = updateBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const batch = await prisma.batch.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ batch });
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

  await prisma.batch.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
