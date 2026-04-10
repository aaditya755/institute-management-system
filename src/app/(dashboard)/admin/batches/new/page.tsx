"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const subjects = ["Physics", "Chemistry", "Biology", "Mathematics", "CS", "English", "Hindi"] as const;

const batchSchema = z.object({
  name: z.string().min(2, "Batch name is required"),
  subject: z.string().min(1, "Select a subject"),
  facultyId: z.string().min(1, "Select a faculty member"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  days: z.array(z.string()).min(1, "Select at least one day"),
});

type BatchValues = z.infer<typeof batchSchema>;

type FacultyOption = {
  id: string;
  user: {
    name: string;
  };
  subjects: string[];
};

export default function NewBatchPage() {
  const router = useRouter();
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);

  const form = useForm<BatchValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: "",
      subject: "Physics",
      facultyId: "",
      startTime: "09:00",
      endTime: "11:00",
      days: ["Mon", "Wed", "Fri"],
    },
  });

  useEffect(() => {
    const loadFaculty = async () => {
      try {
        const response = await fetch("/api/faculty");
        const data = (await response.json()) as { faculty?: FacultyOption[] };
        setFacultyOptions(data.faculty ?? []);
      } catch {
        toast.error("✗ Unable to load faculty list");
      }
    };

    void loadFaculty();
  }, []);

  const selectedDays = form.watch("days");

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to create batch");
      }

      toast.success("✓ Batch created");
      router.push("/admin/batches");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(`✗ ${message}`);
    }
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin/batches"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-4 py-2 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Create Batch</h1>
          <p className="mt-1 text-sm text-brand-muted">Set up a new batch with subject, faculty, schedule, and meeting days.</p>
        </div>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-white">
                Batch Name
              </label>
              <input
                id="name"
                className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-white">
                Subject
              </label>
              <select
                id="subject"
                className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                {...form.register("subject")}
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="facultyId" className="text-sm font-medium text-white">
                Faculty
              </label>
              <select
                id="facultyId"
                className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                {...form.register("facultyId")}
              >
                <option value="">Select faculty</option>
                {facultyOptions.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.user.name} · {faculty.subjects.join(", ")}
                  </option>
                ))}
              </select>
              {form.formState.errors.facultyId ? (
                <p className="text-xs text-red-400">{form.formState.errors.facultyId.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="startTime" className="text-sm font-medium text-white">
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                {...form.register("startTime")}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endTime" className="text-sm font-medium text-white">
                End Time
              </label>
              <input
                id="endTime"
                type="time"
                className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                {...form.register("endTime")}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-brand-border bg-white/[0.02] p-5">
            <div className="mb-4">
              <h2 className="font-outfit text-xl font-semibold text-white">Days</h2>
              <p className="text-sm text-brand-muted">Pick the weekly meeting schedule for this batch.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {days.map((day) => {
                const selected = selectedDays.includes(day);
                return (
                  <label
                    key={day}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                      selected
                        ? "border-violet-500 bg-violet-500/10 text-white"
                        : "border-brand-border bg-brand-dark text-brand-muted hover:border-violet-500/50 hover:text-white"
                    }`}
                  >
                    <span>{day}</span>
                    <input
                      type="checkbox"
                      value={day}
                      className="h-4 w-4 accent-violet-600"
                      {...form.register("days")}
                    />
                  </label>
                );
              })}
            </div>
            {form.formState.errors.days ? (
              <p className="mt-3 text-xs text-red-400">{form.formState.errors.days.message}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-brand-border pt-6">
            <Link
              href="/admin/batches"
              className="inline-flex items-center rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
            >
              Create Batch
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
