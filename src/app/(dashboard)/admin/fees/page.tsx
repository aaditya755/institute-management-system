import { AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatCurrency, formatDate } from "@/lib/utils";

type FeesPageProps = {
  searchParams?: {
    tab?: string;
  };
};

export default async function AdminFeesPage({ searchParams }: FeesPageProps) {
  await requireRole("ADMIN");

  const activeTab = searchParams?.tab ?? "all";
  const now = new Date();

  const fees = await prisma.fee.findMany({
    include: {
      student: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const filteredFees = fees.filter((fee) => {
    if (activeTab === "all") return true;
    if (activeTab === "overdue") return fee.status !== "PAID" && fee.dueDate < now;
    return fee.status.toLowerCase() === activeTab;
  });

  const totalCollected = fees.filter((fee) => fee.status === "PAID").reduce((sum, fee) => sum + fee.amount, 0);
  const totalPending = fees.filter((fee) => fee.status !== "PAID").reduce((sum, fee) => sum + fee.amount, 0);
  const overdueCount = fees.filter((fee) => fee.status !== "PAID" && fee.dueDate < now).length;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-outfit text-3xl font-semibold text-white">Fee Management</h1>
        <p className="mt-1 text-sm text-brand-muted">Track collections, overdue installments, and payment completion.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card rounded-3xl p-5">
          <div className="flex items-center gap-3 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm">Total Collected</span>
          </div>
          <p className="mt-4 font-outfit text-3xl font-semibold text-white">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <div className="flex items-center gap-3 text-red-300">
            <CreditCard className="h-5 w-5" />
            <span className="text-sm">Total Pending</span>
          </div>
          <p className="mt-4 font-outfit text-3xl font-semibold text-white">{formatCurrency(totalPending)}</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <div className="flex items-center gap-3 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">Overdue Count</span>
          </div>
          <p className="mt-4 font-outfit text-3xl font-semibold text-white">{overdueCount}</p>
        </div>
      </div>

      <div className="premium-card rounded-3xl p-5">
        <div className="flex flex-wrap gap-2">
          {["all", "paid", "unpaid", "partial", "overdue"].map((tab) => (
            <a
              key={tab}
              href={`/admin/fees?tab=${tab}`}
              className={`rounded-full px-4 py-2 text-sm transition ${
                activeTab === tab
                  ? "bg-violet-600 text-white"
                  : "border border-brand-border text-brand-muted hover:border-violet-500 hover:text-white"
              }`}
            >
              {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </a>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-brand-border text-brand-muted">
              <tr>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Installment</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Due Date</th>
                <th className="px-3 py-3">Paid Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFees.map((fee) => (
                <tr key={fee.id} className="border-b border-brand-border/60 hover:bg-[#16162A]">
                  <td className="px-3 py-3 text-white">{fee.student.user.name}</td>
                  <td className="px-3 py-3 text-brand-muted">#{fee.installmentNo}</td>
                  <td className="px-3 py-3 text-white">{formatCurrency(fee.amount)}</td>
                  <td className="px-3 py-3 text-brand-muted">{formatDate(fee.dueDate)}</td>
                  <td className="px-3 py-3 text-brand-muted">{fee.paidDate ? formatDate(fee.paidDate) : "Not paid"}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        fee.status === "PAID"
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : fee.status === "PARTIAL"
                            ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border border-red-500/20 bg-red-500/10 text-red-400"
                      }`}
                    >
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="rounded-xl border border-brand-border px-3 py-2 text-xs text-brand-muted transition hover:border-violet-500 hover:text-white"
                    >
                      Mark Paid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
