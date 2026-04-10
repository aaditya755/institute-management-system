"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const subjects = ["Physics", "Chemistry", "Biology", "Mathematics", "CS", "English", "Hindi"] as const;

const facultySchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  qualification: z.string().min(3, "Qualification is required"),
  salary: z.coerce.number().min(1, "Salary must be greater than 0"),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
});

type FacultyValues = z.infer<typeof facultySchema>;

export default function NewFacultyPage() {
  const router = useRouter();

  const form = useForm<FacultyValues>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      name: "",
      email: "",
      password: "Faculty@123",
      qualification: "",
      salary: 35000,
      subjects: [],
    },
  });

  const selectedSubjects = form.watch("subjects");

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/faculty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to create faculty member");
      }

      toast.success("✓ Faculty member added");
      router.push("/admin/faculty");
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
          href="/admin/faculty"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-4 py-2 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="font-outfit text-3xl font-semibold text-white">Add Faculty Member</h1>
          <p className="mt-1 text-sm text-brand-muted">Create a faculty account and configure subject expertise.</p>
        </div>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <form className="space-y-6" onSubmit={onSubmit}>
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
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white">
                Password
              </label>
              <input
                id="password"
                className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="qualification" className="text-sm font-medium text-white">
                Qualification
              </label>
              <input
                id="qualification"
                className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                {...form.register("qualification")}
              />
              {form.formState.errors.qualification ? (
                <p className="text-xs text-red-400">{form.formState.errors.qualification.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="salary" className="text-sm font-medium text-white">
                Salary
              </label>
              <input
                id="salary"
                type="number"
                className="h-11 w-full rounded-xl border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                {...form.register("salary")}
              />
              {form.formState.errors.salary ? (
                <p className="text-xs text-red-400">{form.formState.errors.salary.message}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-brand-border bg-white/[0.02] p-5">
            <div className="mb-4">
              <h2 className="font-outfit text-xl font-semibold text-white">Subjects</h2>
              <p className="text-sm text-brand-muted">Choose the subjects this faculty member can teach.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {subjects.map((subject) => {
                const selected = selectedSubjects.includes(subject);
                return (
                  <label
                    key={subject}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                      selected
                        ? "border-violet-500 bg-violet-500/10 text-white"
                        : "border-brand-border bg-brand-dark text-brand-muted hover:border-violet-500/50 hover:text-white"
                    }`}
                  >
                    <span>{subject}</span>
                    <input
                      type="checkbox"
                      value={subject}
                      className="h-4 w-4 accent-violet-600"
                      {...form.register("subjects")}
                    />
                  </label>
                );
              })}
            </div>
            {form.formState.errors.subjects ? (
              <p className="mt-3 text-xs text-red-400">{form.formState.errors.subjects.message}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-brand-border pt-6">
            <Link
              href="/admin/faculty"
              className="inline-flex items-center rounded-xl border border-brand-border px-4 py-2.5 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
            >
              Add Faculty Member
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
