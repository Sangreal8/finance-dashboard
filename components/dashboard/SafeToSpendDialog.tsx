"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  FinancialPosition,
  SafeToSpendBreakdown,
} from "@/lib/finance/types";

interface SafeToSpendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: FinancialPosition;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface BreakdownRowProps {
  label: string;
  amount: number;
  description?: string;
  subtract?: boolean;
}

function BreakdownRow({
  label,
  amount,
  description,
  subtract = false,
}: BreakdownRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div>
        <p className="text-sm font-medium text-zinc-950">{label}</p>

        {description && (
          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
        )}
      </div>

      <p className="shrink-0 text-sm font-semibold text-zinc-950">
        {subtract ? "−" : ""}
        {formatCurrency(Math.abs(amount))}
      </p>
    </div>
  );
}

function getBreakdown(position: FinancialPosition): SafeToSpendBreakdown {
  return position.safeToSpendBreakdown;
}

export function SafeToSpendDialog({
  open,
  onOpenChange,
  position,
}: SafeToSpendDialogProps) {
  const breakdown = getBreakdown(position);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-zinc-100 px-6 py-6 pr-14">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            Today
          </p>

          <DialogTitle className="text-2xl font-semibold tracking-tight text-zinc-950">
            Safe to Spend
          </DialogTitle>

          <DialogDescription className="leading-6">
            Cash that remains after known commitments, reserved money and your
            safety buffer are protected.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="divide-y divide-zinc-100">
            <BreakdownRow
              label="Available today"
              amount={breakdown.availableCash}
              description="Cash currently available across accounts included in the calculation."
            />

            <BreakdownRow
              label="Known commitments"
              amount={breakdown.remainingCommitments}
              description="Confirmed obligations in the current plan that have not yet been paid."
              subtract
            />

            <BreakdownRow
              label="Reserved money"
              amount={breakdown.reservedMoney}
              description="Money deliberately protected for future costs."
              subtract
            />

            <BreakdownRow
              label="Safety buffer"
              amount={breakdown.safetyBuffer}
              description="The amount kept untouched as an additional margin of safety."
              subtract
            />
          </div>

          <div className="my-4 rounded-2xl bg-zinc-950 px-5 py-5 text-white">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400">Safe to Spend</p>

                <p className="mt-1 text-3xl font-semibold tracking-tight">
                  {formatCurrency(breakdown.safeToSpend)}
                </p>
              </div>

              <p className="pb-1 text-xs text-zinc-400">Known facts only</p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-medium text-zinc-950">
                  Daily budget
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Safe to Spend divided across the time remaining until payday.
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-zinc-950">
                  {formatCurrency(position.dailyBudget)}
                  <span className="ml-1 text-xs font-medium text-zinc-500">
                    / day
                  </span>
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {position.daysUntilPayday === 0
                    ? "Payday today"
                    : position.daysUntilPayday === 1
                      ? "1 day remaining"
                      : `${position.daysUntilPayday} days remaining`}
                </p>
              </div>
            </div>
          </div>

          <p className="pb-6 text-xs leading-5 text-zinc-500">
            Forecast spending is deliberately excluded from Safe to Spend. It
            will appear separately in the month-end forecast because it is an
            estimate rather than a confirmed obligation.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
