import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function StudentFeesPage() {
  const session = await requireRole("STUDENT");

  const student = await prisma.student.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      fees: {
        orderBy: {
          installmentNo: "asc",
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  const total = student.fees.reduce((sum, fee) => sum + fee.amount, 0);
  const paid = student.fees.filter((fee) => fee.status === "PAID").reduce((sum, fee) => sum + fee.amount, 0);
  const pending = total - paid;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-outfit text-3xl font-semibold text-white">Fees</h1>
        <p className="mt-1 text-sm text-brand-muted">Review your installment timeline and current payment status.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-brand-muted">Total Fees</p>
          <p className="mt-3 font-outfit text-3xl font-semibold text-white">{formatCurrency(total)}</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-emerald-300">Paid</p>
          <p className="mt-3 font-outfit text-3xl font-semibold text-white">{formatCurrency(paid)}</p>
        </div>
        <div className="premium-card rounded-3xl p-5">
          <p className="text-sm text-red-300">Pending</p>
          <p className="mt-3 font-outfit text-3xl font-semibold text-white">{formatCurrency(pending)}</p>
        </div>
      </div>

      <div className="premium-card rounded-3xl p-6">
        <div className="relative ml-3 border-l border-brand-border pl-8">
          {student.fees.map((fee, index) => {
            const overdueDays =
              fee.status === "PAID"
                ? 0
                : Math.max(0, Math.ceil((Date.now() - fee.dueDate.getTime()) / (1000 * 60 * 60 * 24)));

            return (
              <div key={fee.id} className={`${index !== student.fees.length - 1 ? "pb-8" : ""} relative`}>
                <div className="absolute -left-[41px] top-3 h-4 w-4 rounded-full border-4 border-brand-card bg-violet-500" />
                <div className="rounded-3xl border border-brand-border bg-white/[0.02] p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-brand-border px-2.5 py-1 text-xs text-brand-muted">
                          Installment {fee.installmentNo}
                        </span>
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
                      </div>
                      <p className="mt-3 font-medium text-white">{fee.description ?? "Tuition installment"}</p>
                      <p className="mt-1 text-sm text-brand-muted">Due {formatDate(fee.dueDate)}</p>
                      {fee.paidDate ? (
                        <p className="mt-1 text-sm text-emerald-300">Paid on {formatDate(fee.paidDate)}</p>
                      ) : null}
                      {overdueDays > 0 ? (
                        <p className="mt-2 text-sm text-red-400">{overdueDays} days overdue</p>
                      ) : null}
                    </div>

                    <div className="font-outfit text-2xl font-semibold text-white">{formatCurrency(fee.amount)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
        <p className="text-sm text-amber-100">
          Contact admin to pay any unpaid or partial installments and keep your account in good standing.
        </p>
      </div>
    </section>
  );
}
