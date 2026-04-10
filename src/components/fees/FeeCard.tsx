import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type FeeCardProps = {
  installmentNo: number;
  amount: number;
  dueDate: string | Date;
  paidDate?: string | Date | null;
  status: "PAID" | "UNPAID" | "PARTIAL";
  description?: string | null;
};

export default function FeeCard({
  installmentNo,
  amount,
  dueDate,
  paidDate,
  status,
  description,
}: FeeCardProps) {
  const overdueDays =
    status === "PAID"
      ? 0
      : Math.max(0, Math.ceil((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <Card className="bg-white/[0.02]">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="muted">Installment {installmentNo}</Badge>
              <Badge
                variant={
                  status === "PAID" ? "success" : status === "PARTIAL" ? "warning" : "danger"
                }
              >
                {status}
              </Badge>
            </div>
            <p className="mt-3 font-medium text-white">{description ?? "Tuition installment"}</p>
            <p className="mt-1 text-sm text-brand-muted">Due {formatDate(dueDate)}</p>
            {paidDate ? <p className="mt-1 text-sm text-emerald-300">Paid on {formatDate(paidDate)}</p> : null}
            {overdueDays > 0 ? <p className="mt-2 text-sm text-red-400">{overdueDays} days overdue</p> : null}
          </div>
          <div className="font-outfit text-2xl font-semibold text-white">{formatCurrency(amount)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
