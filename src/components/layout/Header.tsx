"use client";

import { Bell, ChevronRight, LogOut, Menu, Settings, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { getInitials } from "@/lib/utils";

type HeaderProps = {
  user: {
    name: string;
    email: string;
  };
  onOpenMobileSidebar?: () => void;
};

const titles: Record<string, { title: string; breadcrumb: string[] }> = {
  "/admin": { title: "Dashboard", breadcrumb: ["Admin", "Dashboard"] },
  "/admin/students": { title: "Students", breadcrumb: ["Admin", "Students"] },
  "/admin/faculty": { title: "Faculty", breadcrumb: ["Admin", "Faculty"] },
  "/admin/batches": { title: "Batches", breadcrumb: ["Admin", "Batches"] },
  "/admin/fees": { title: "Fee Management", breadcrumb: ["Admin", "Fees"] },
  "/admin/timetable": { title: "Timetable", breadcrumb: ["Admin", "Timetable"] },
  "/admin/exams": { title: "Examinations", breadcrumb: ["Admin", "Exams"] },
  "/admin/results": { title: "Results", breadcrumb: ["Admin", "Results"] },
  "/faculty": { title: "Dashboard", breadcrumb: ["Faculty", "Dashboard"] },
  "/faculty/attendance": { title: "Attendance", breadcrumb: ["Faculty", "Attendance"] },
  "/faculty/timetable": { title: "Timetable", breadcrumb: ["Faculty", "Timetable"] },
  "/faculty/exams": { title: "Exams", breadcrumb: ["Faculty", "Exams"] },
  "/student": { title: "Dashboard", breadcrumb: ["Student", "Dashboard"] },
  "/student/attendance": { title: "Attendance", breadcrumb: ["Student", "Attendance"] },
  "/student/fees": { title: "Fees", breadcrumb: ["Student", "Fees"] },
  "/student/timetable": { title: "Timetable", breadcrumb: ["Student", "Timetable"] },
  "/student/results": { title: "Results", breadcrumb: ["Student", "Results"] },
};

export default function Header({ user, onOpenMobileSidebar }: HeaderProps) {
  const pathname = usePathname();
  const fallbackTitle = pathname.split("/").filter(Boolean).slice(-1)[0] ?? "Dashboard";
  const resolved = titles[pathname] ?? {
    title: fallbackTitle.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    breadcrumb: pathname.split("/").filter(Boolean).map((segment) =>
      segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    ),
  };

  return (
    <header className="glass-header sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onOpenMobileSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-brand-muted transition hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            {resolved.breadcrumb.map((item, index) => (
              <span key={item} className="inline-flex items-center gap-2">
                {index > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                {item}
              </span>
            ))}
          </div>
          <h1 className="font-outfit text-xl font-semibold text-white">{resolved.title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-brand-muted transition hover:border-violet-500 hover:text-white"
        >
          <Bell className="h-4 w-4" />
        </button>

        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
              {getInitials(user.name)}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-brand-muted">{user.email}</p>
            </div>
          </summary>

          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-brand-border bg-brand-card p-2 shadow-premium">
            <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-brand-muted transition hover:bg-white/5 hover:text-white">
              <User className="h-4 w-4" />
              Profile
            </button>
            <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-brand-muted transition hover:bg-white/5 hover:text-white">
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
