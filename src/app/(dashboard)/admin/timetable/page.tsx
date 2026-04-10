import { Plus } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatTime } from "@/lib/utils";

type TimetablePageProps = {
  searchParams?: {
    batchId?: string;
  };
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AdminTimetablePage({ searchParams }: TimetablePageProps) {
  await requireRole("ADMIN");

  const batches = await prisma.batch.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  const selectedBatchId = searchParams?.batchId ?? batches[0]?.id ?? "";

  const timetable = await prisma.timetable.findMany({
    where: selectedBatchId ? { batchId: selectedBatchId } : undefined,
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
      batch: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ startTime: "asc" }, { day: "asc" }],
  });

  const timeSlots = Array.from(new Set(timetable.map((item) => `${item.startTime}-${item.endTime}`)));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Timetable</h1>
          <p className="mt-1 text-sm text-brand-muted">Weekly academic schedule across all instructional batches.</p>
        </div>
        <form>
          <select
            name="batchId"
            defaultValue={selectedBatchId}
            className="h-11 rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
          <button type="submit" className="sr-only">
            Apply batch filter
          </button>
        </form>
      </div>

      <div className="premium-card rounded-3xl p-5">
        <div className="grid min-w-[900px] grid-cols-7 gap-3 overflow-x-auto">
          <div className="rounded-2xl border border-brand-border bg-brand-dark p-4 text-sm font-medium text-brand-muted">
            Time
          </div>
          {weekDays.map((day) => (
            <div
              key={day}
              className="rounded-2xl border border-brand-border bg-brand-dark p-4 text-center text-sm font-medium text-white"
            >
              {day}
            </div>
          ))}

          {timeSlots.map((slot) => {
            const [startTime, endTime] = slot.split("-");
            return (
              <div key={slot} className="contents">
                <div className="rounded-2xl border border-brand-border bg-white/[0.02] p-4 text-sm text-brand-muted">
                  {formatTime(startTime)}
                  <br />
                  <span className="text-xs">{formatTime(endTime)}</span>
                </div>
                {weekDays.map((day) => {
                  const entry = timetable.find(
                    (item) => item.day === day && item.startTime === startTime && item.endTime === endTime,
                  );

                  return (
                    <div key={`${slot}-${day}`} className="min-h-32 rounded-2xl border border-brand-border bg-white/[0.02] p-3">
                      {entry ? (
                        <div className="h-full rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
                          <p className="font-medium text-white">{entry.subject}</p>
                          <p className="mt-1 text-xs text-brand-muted">{entry.faculty.user.name}</p>
                          <p className="mt-3 text-xs text-brand-muted">
                            {entry.batch.name} · {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                          </p>
                          <div className="mt-3 flex gap-2 text-xs">
                            <button type="button" className="rounded-lg border border-brand-border px-2 py-1 text-brand-muted transition hover:border-violet-500 hover:text-white">
                              Edit
                            </button>
                            <button type="button" className="rounded-lg border border-brand-border px-2 py-1 text-brand-muted transition hover:border-red-500 hover:text-red-300">
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-brand-border text-brand-muted transition hover:border-violet-500 hover:text-white"
                          aria-label={`Add slot for ${day} ${slot}`}
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
