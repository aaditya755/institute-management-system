"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const examSchema = z.object({
  name: z.string().min(2, "Exam name is required"),
  batchId: z.string().min(1, "Select a batch"),
  subject: z.string().min(1, "Subject is required"),
  date: z.string().min(1, "Date is required"),
  totalMarks: z.coerce.number().min(1, "Total marks must be greater than 0"),
});

type ExamValues = z.infer<typeof examSchema>;

type BatchOption = {
  id: string;
  name: string;
  subject: string;
};

export default function NewExamPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchOption[]>([]);

  const form = useForm<ExamValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: "",
      batchId: "",
      subject: "",
      date: new Date().toISOString().slice(0, 10),
      totalMarks: 100,
    },
  });

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const response = await fetch("/api/batches");
        const data = (await response.json()) as { batches?: BatchOption[] };
        setBatches(data.batches ?? []);
      } catch {
        toast.error("✗ Unable to load batches");
      }
    };

    void loadBatches();
  }, []);

  const selectedBatchId = form.watch("batchId");

  useEffect(() => {
    const batch = batches.find((item) => item.id === selectedBatchId);
    if (batch) {
      form.setValue("subject", batch.subject);
    }
  }, [selectedBatchId, batches, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to schedule exam");
      }

      toast.success("✓ Exam scheduled");
      router.push("/admin/exams");
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
          href="/admin/exams"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-4 py-2 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Schedule Exam</h1>
          <p className="mt-1 text-sm text-brand-muted">Plan an assessment for a batch and keep the subject details aligned.</p>
        </div>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="name" className="text-sm font-medium text-white">
              Exam Name
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
            <label htmlFor="batchId" className="text-sm font-medium text-white">
              Batch
            </label>
            <select
              id="batchId"
              className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
              {...form.register("batchId")}
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
            {form.formState.errors.batchId ? (
              <p className="text-xs text-red-400">{form.formState.errors.batchId.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium text-white">
              Subject
            </label>
            <input
              id="subject"
              className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
              {...form.register("subject")}
            />
            {form.formState.errors.subject ? (
              <p className="text-xs text-red-400">{form.formState.errors.subject.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium text-white">
              Date
            </label>
            <input
              id="date"
              type="date"
              className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
              {...form.register("date")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="totalMarks" className="text-sm font-medium text-white">
              Total Marks
            </label>
            <input
              id="totalMarks"
              type="number"
              className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
              {...form.register("totalMarks")}
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap justify-end gap-3 border-t border-brand-border pt-6">
            <Link
              href="/admin/exams"
              className="inline-flex items-center rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
            >
              Schedule Exam
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
