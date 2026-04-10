"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type PaymentModalProps = {
  feeId: string;
  studentName: string;
  amount: number;
  defaultPaidDate?: string;
  triggerLabel?: string;
  onPaid?: () => void;
};

export default function PaymentModal({
  feeId,
  studentName,
  amount,
  defaultPaidDate,
  triggerLabel = "Mark Paid",
  onPaid,
}: PaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [paidDate, setPaidDate] = useState(defaultPaidDate ?? new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/fees/${feeId}/pay`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paidDate }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to update payment");
      }

      toast.success("✓ Fee marked as paid");
      setOpen(false);
      onPaid?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(`✗ ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            Mark this installment as paid for {studentName}. The amount due is {formatCurrency(amount)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-border bg-white/[0.02] p-4">
            <p className="text-sm text-brand-muted">Student</p>
            <p className="mt-1 font-medium text-white">{studentName}</p>
            <p className="mt-3 text-sm text-brand-muted">Amount</p>
            <p className="mt-1 font-medium text-white">{formatCurrency(amount)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidDate">Paid Date</Label>
            <Input
              id="paidDate"
              type="date"
              value={paidDate}
              onChange={(event) => setPaidDate(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
