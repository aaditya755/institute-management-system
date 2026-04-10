"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const enrollmentSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Phone number is required"),
  parentPhone: z.string().min(10, "Parent phone is required"),
  address: z.string().min(8, "Address is required"),
  rollNo: z.string().min(3, "Roll number is required"),
  batchId: z.string().min(1, "Select a batch"),
});

type EnrollmentValues = z.infer<typeof enrollmentSchema>;

type BatchOption = {
  id: string;
  name: string;
  subject: string;
};

function generatePassword() {
  return `Student@${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateRollNo() {
  return `MC-${new Date().getFullYear().toString().slice(-2)}${Math.floor(100 + Math.random() * 900)}`;
}

export default function NewStudentPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoPassword, setAutoPassword] = useState(true);

  const form = useForm<EnrollmentValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      name: "",
      email: "",
      password: generatePassword(),
      phone: "",
      parentPhone: "",
      address: "",
      rollNo: generateRollNo(),
      batchId: "",
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
      } finally {
        setLoadingBatches(false);
      }
    };

    void loadBatches();
  }, []);

  useEffect(() => {
    if (autoPassword) {
      form.setValue("password", generatePassword());
    }
  }, [autoPassword, form]);

  const sectionDivider = useMemo(
    () => "border-t border-brand-border pt-6 first:border-t-0 first:pt-0",
    [],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to enroll student");
      }

      toast.success("✓ Student enrolled successfully");
      router.push("/admin/students");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(`✗ ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-4 py-2 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Enroll New Student</h1>
          <p className="mt-1 text-sm text-brand-muted">Create a student account and assign them to the right batch.</p>
        </div>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <form className="space-y-6" onSubmit={onSubmit}>
          <section className={sectionDivider}>
            <div className="mb-5">
              <h2 className="font-outfit text-xl font-semibold text-white">Personal Info</h2>
              <p className="text-sm text-brand-muted">Set up the student account credentials.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-white">
                  Full Name
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
                <label htmlFor="email" className="text-sm font-medium text-white">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-white">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setAutoPassword((value) => !value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      autoPassword
                        ? "bg-violet-500/10 text-violet-300"
                        : "border border-brand-border text-brand-muted"
                    }`}
                  >
                    Auto-generate
                  </button>
                </div>
                <div className="flex gap-3">
                  <input
                    id="password"
                    className="h-11 flex-1 rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => form.setValue("password", generatePassword(), { shouldValidate: true })}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-brand-border px-4 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
                {form.formState.errors.password ? (
                  <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className={sectionDivider}>
            <div className="mb-5">
              <h2 className="font-outfit text-xl font-semibold text-white">Contact</h2>
              <p className="text-sm text-brand-muted">Keep guardians informed with accurate contact details.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-white">
                  Phone
                </label>
                <input
                  id="phone"
                  className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                  {...form.register("phone")}
                />
                {form.formState.errors.phone ? (
                  <p className="text-xs text-red-400">{form.formState.errors.phone.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="parentPhone" className="text-sm font-medium text-white">
                  Parent Phone
                </label>
                <input
                  id="parentPhone"
                  className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                  {...form.register("parentPhone")}
                />
                {form.formState.errors.parentPhone ? (
                  <p className="text-xs text-red-400">{form.formState.errors.parentPhone.message}</p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="address" className="text-sm font-medium text-white">
                  Address
                </label>
                <textarea
                  id="address"
                  rows={4}
                  className="w-full rounded-xl border border-brand-border bg-brand-dark px-3 py-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                  {...form.register("address")}
                />
                {form.formState.errors.address ? (
                  <p className="text-xs text-red-400">{form.formState.errors.address.message}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className={sectionDivider}>
            <div className="mb-5">
              <h2 className="font-outfit text-xl font-semibold text-white">Academic</h2>
              <p className="text-sm text-brand-muted">Assign the roll number and batch placement.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="rollNo" className="text-sm font-medium text-white">
                    Roll Number
                  </label>
                  <button
                    type="button"
                    onClick={() => form.setValue("rollNo", generateRollNo(), { shouldValidate: true })}
                    className="text-xs text-violet-300 transition hover:text-violet-200"
                  >
                    Auto-suggest
                  </button>
                </div>
                <input
                  id="rollNo"
                  className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                  {...form.register("rollNo")}
                />
                {form.formState.errors.rollNo ? (
                  <p className="text-xs text-red-400">{form.formState.errors.rollNo.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="batchId" className="text-sm font-medium text-white">
                  Batch
                </label>
                <select
                  id="batchId"
                  disabled={loadingBatches}
                  className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 disabled:opacity-60"
                  {...form.register("batchId")}
                >
                  <option value="">{loadingBatches ? "Loading batches..." : "Select a batch"}</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} · {batch.subject}
                    </option>
                  ))}
                </select>
                {form.formState.errors.batchId ? (
                  <p className="text-xs text-red-400">{form.formState.errors.batchId.message}</p>
                ) : null}
              </div>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t border-brand-border pt-6">
            <Link
              href="/admin/students"
              className="inline-flex items-center rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Enrolling..." : "Enroll Student"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
