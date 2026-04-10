"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

type EnrollmentFormProps = {
  onSuccess?: () => void;
};

function generatePassword() {
  return `Student@${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateRollNo() {
  return `MC-${new Date().getFullYear().toString().slice(-2)}${Math.floor(100 + Math.random() * 900)}`;
}

export default function EnrollmentForm({ onSuccess }: EnrollmentFormProps) {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const sectionClassName = useMemo(
    () => "space-y-4 rounded-3xl border border-brand-border bg-white/[0.02] p-5",
    [],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
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
        throw new Error(typeof data.error === "string" ? data.error : "Unable to enroll student");
      }

      toast.success("✓ Student enrolled");
      onSuccess?.();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(`✗ ${message}`);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <section className={sectionClassName}>
        <div>
          <h2 className="font-outfit text-xl font-semibold text-white">Personal Info</h2>
          <p className="text-sm text-brand-muted">Set up the login identity for the new student.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name ? <p className="text-xs text-red-400">{form.formState.errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-xs text-red-400">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => form.setValue("password", generatePassword(), { shouldValidate: true })}
              >
                <RefreshCw className="h-4 w-4" />
                Generate
              </Button>
            </div>
            <Input id="password" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-xs text-red-400">{form.formState.errors.password.message}</p> : null}
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div>
          <h2 className="font-outfit text-xl font-semibold text-white">Contact</h2>
          <p className="text-sm text-brand-muted">Keep guardian and student details ready for communication.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
            {form.formState.errors.phone ? <p className="text-xs text-red-400">{form.formState.errors.phone.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentPhone">Parent Phone</Label>
            <Input id="parentPhone" {...form.register("parentPhone")} />
            {form.formState.errors.parentPhone ? <p className="text-xs text-red-400">{form.formState.errors.parentPhone.message}</p> : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={4} {...form.register("address")} />
            {form.formState.errors.address ? <p className="text-xs text-red-400">{form.formState.errors.address.message}</p> : null}
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div>
          <h2 className="font-outfit text-xl font-semibold text-white">Academic</h2>
          <p className="text-sm text-brand-muted">Assign the roll number and coaching batch.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rollNo">Roll Number</Label>
              <button
                type="button"
                className="text-xs text-violet-300 transition hover:text-violet-200"
                onClick={() => form.setValue("rollNo", generateRollNo(), { shouldValidate: true })}
              >
                Auto-suggest
              </button>
            </div>
            <Input id="rollNo" {...form.register("rollNo")} />
            {form.formState.errors.rollNo ? <p className="text-xs text-red-400">{form.formState.errors.rollNo.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="batchId">Batch</Label>
            <select
              id="batchId"
              disabled={loadingBatches}
              className="flex h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 py-2 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
              {...form.register("batchId")}
            >
              <option value="">{loadingBatches ? "Loading batches..." : "Select a batch"}</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} · {batch.subject}
                </option>
              ))}
            </select>
            {form.formState.errors.batchId ? <p className="text-xs text-red-400">{form.formState.errors.batchId.message}</p> : null}
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Enrolling..." : "Enroll Student"}
        </Button>
      </div>
    </form>
  );
}
