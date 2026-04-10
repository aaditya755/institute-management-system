import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

const createSlotSchema = z.object({
  batchId: z.string().min(1),
  facultyId: z.string().min(1),
  day: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  subject: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");
  const facultyId = searchParams.get("facultyId");

  const where =
    session.user.role === "FACULTY"
      ? { faculty: { userId: session.user.id } }
      : session.user.role === "STUDENT"
        ? { batch: { students: { some: { userId: session.user.id } } } }
        : {
            ...(batchId ? { batchId } : {}),
            ...(facultyId ? { facultyId } : {}),
          };

  const timetable = await prisma.timetable.findMany({
    where,
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
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ timetable });
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
  const parsed = createSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slot = await prisma.timetable.create({
    data: parsed.data,
  });

  return NextResponse.json({ slot }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.timetable.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
