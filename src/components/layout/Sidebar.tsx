"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, Users, GraduationCap, BookOpen, CreditCard, Calendar, FileText, BarChart2, CheckSquare, CalendarDays, Trophy, Sparkles } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";

type Role = "ADMIN" | "FACULTY" | "STUDENT";

type SidebarProps = {
  role: Role;
  user: {
    name: string;
    email: string;
  };
};

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg width="32" height="32" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#111120" />
        <path d="M14 48V16h8l10 14 10-14h8v32h-8V29L32 42 22 29v19h-8Z" fill="#7C3AED" />
        <path d="M34 24.5 41.5 17l4.5 4.5-12 12-6.5-6.5 4.5-4.5 2 2Z" fill="#F59E0B" />
      </svg>
      <div className="font-outfit text-lg font-semibold text-white">
        Milestone <span className="text-violet-400">Coaches</span>
      </div>
    </div>
  );
}

const navByRole = {
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Faculty", href: "/admin/faculty", icon: GraduationCap },
    { label: "Batches", href: "/admin/batches", icon: BookOpen },
    { label: "Fees", href: "/admin/fees", icon: CreditCard },
    { label: "Timetable", href: "/admin/timetable", icon: Calendar },
    { label: "Exams", href: "/admin/exams", icon: FileText },
    { label: "Results", href: "/admin/results", icon: BarChart2 },
  ],
  FACULTY: [
    { label: "Dashboard", href: "/faculty", icon: LayoutDashboard },
    { label: "Attendance", href: "/faculty/attendance", icon: CheckSquare },
    { label: "Timetable", href: "/faculty/timetable", icon: Calendar },
    { label: "Exams", href: "/faculty/exams", icon: FileText },
  ],
  STUDENT: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Attendance", href: "/student/attendance", icon: CalendarDays },
    { label: "Fees", href: "/student/fees", icon: CreditCard },
    { label: "Timetable", href: "/student/timetable", icon: Calendar },
    { label: "Results", href: "/student/results", icon: Trophy },
    { label: "Ask Zara (AI)", href: "#nova-chat", icon: Sparkles },
  ],
} satisfies Record<Role, Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }>>;

export default function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navByRole[role];

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] flex-col border-r border-brand-border bg-brand-sidebar">
      <div className="flex h-16 items-center border-b border-brand-border px-6">
        <Logo />
      </div>

      <div className="px-6 py-3 text-xs uppercase tracking-[0.24em] text-brand-muted">Navigation</div>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href !== "#nova-chat" && (pathname === item.href || pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "mx-2 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-brand-muted transition hover:bg-white/5 hover:text-white",
                isActive && "rounded-l-none border-l-[3px] border-violet-500 bg-violet-500/10 text-violet-400",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-4 rounded-2xl border border-brand-border bg-brand-card p-4 shadow-premium">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <span className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-300">
              {role}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-muted transition hover:border-violet-500 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
