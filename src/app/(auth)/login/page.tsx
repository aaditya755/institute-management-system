"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function MilestoneLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#111120" />
      <path
        d="M14 48V16h8l10 14 10-14h8v32h-8V29L32 42 22 29v19h-8Z"
        fill="#7C3AED"
      />
      <path d="M34 24.5 41.5 17l4.5 4.5-12 12-6.5-6.5 4.5-4.5 2 2Z" fill="#F59E0B" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const cardClassName = useMemo(
    () =>
      `premium-card top-accent-border fade-up relative w-full max-w-md rounded-2xl p-8 ${error ? "animate-shake" : ""}`,
    [error],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Invalid email or password. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const sessionResponse = await fetch("/api/auth/session");
    const session = (await sessionResponse.json()) as {
      user?: { role?: "ADMIN" | "FACULTY" | "STUDENT" };
    };

    const role = session.user?.role;
    if (role) {
      router.push(`/${role.toLowerCase()}`);
      router.refresh();
      return;
    }

    setError("Unable to load your dashboard. Please try again.");
    setIsSubmitting(false);
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-dark px-4">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-5%] h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
      </div>

      <section className={cardClassName}>
        <div className="mb-6 flex flex-col items-center text-center">
          <MilestoneLogo />
          <h1 className="mt-4 font-outfit text-2xl font-bold text-white">Milestone Coaches</h1>
          <p className="mt-1 text-sm text-brand-muted">Every Step Forward Counts</p>
          <div className="mt-5 h-px w-full bg-white/10" />
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          {error ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-brand-text">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-brand-border bg-brand-dark px-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-brand-text">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="h-11 w-full rounded-lg border border-brand-border bg-brand-dark px-3 pr-11 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                {...form.register("password")}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted transition hover:text-white"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-semibold text-white transition-all duration-200 hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In to Dashboard"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-brand-muted">v1.0.0 · Milestone Coaches · 2024</p>
      </section>
    </main>
  );
}
