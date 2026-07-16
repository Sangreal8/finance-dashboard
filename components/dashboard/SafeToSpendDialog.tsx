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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date?: string) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

interface DetailRowProps {
  label: string;
  amount: number;
  description?: string;
  subtract?: boolean;
}

function DetailRow({
  label,
  amount,
  description,
  subtract = false,
}: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-950">{label}</p>

        {description && (
          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
        )}
      </div>

      <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-950">
        {subtract ? "−" : ""}
        {formatCurrency(Math.abs(amount))}
      </p>
    </div>
  );
}

interface SectionTotalProps {
  label: string;
  amount: number;
  subtract?: boolean;
}

function SectionTotal({ label, amount, subtract = false }: SectionTotalProps) {
  return (
    <div className="flex items-center justify-between gap-6 border-t border-zinc-200 pt-3">
      <p className="text-sm font-semibold text-zinc-950">{label}</p>

      <p className="text-sm font-semibold tabular-nums text-zinc-950">
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
            The exact account balances and unpaid commitments used to calculate
            what is genuinely free to spend.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6">
          <section>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
              Current balances
            </p>

            <div className="mt-2 divide-y divide-zinc-100">
              {breakdown.accountBalances.map((account) => (
                <DetailRow
                  key={account.id}
                  label={account.name}
                  amount={account.amount}
                />
              ))}
            </div>

            <SectionTotal
              label="Available today"
              amount={breakdown.availableCash}
            />
          </section>

          <section className="mt-7">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
              Remaining commitments
            </p>

            {breakdown.commitments.length > 0 ? (
              <div className="mt-2 divide-y divide-zinc-100">
                {breakdown.commitments.map((commitment) => {
                  const dueDate = formatDate(commitment.dueDate);

                  const description = dueDate
                    ? `Due ${dueDate}${
                        commitment.confidence === "estimated"
                          ? " · Estimated"
                          : ""
                      }`
                    : commitment.confidence === "estimated"
                      ? "Estimated"
                      : undefined;

                  return (
                    <DetailRow
                      key={commitment.id}
                      label={commitment.name}
                      amount={commitment.amount}
                      description={description}
                      subtract
                    />
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No unpaid commitments are currently included in the plan.
              </p>
            )}

            <div className="mt-2">
              <SectionTotal
                label="Known commitments"
                amount={breakdown.remainingCommitments}
                subtract
              />
            </div>
          </section>

          <section className="mt-7 rounded-2xl border border-zinc-200 bg-zinc-50 px-4">
            <div className="divide-y divide-zinc-200">
              <DetailRow
                label="Reserved money"
                amount={breakdown.reservedMoney}
                description="Money currently protected for a specific future cost."
                subtract
              />

              <DetailRow
                label="Safety buffer"
                amount={breakdown.safetyBuffer}
                description="Extra cash deliberately kept untouched."
                subtract
              />
            </div>
          </section>

          <div className="my-6 rounded-2xl bg-zinc-950 px-5 py-5 text-white">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400">Safe to Spend</p>

                <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                  {formatCurrency(breakdown.safeToSpend)}
                </p>
              </div>

              <p className="pb-1 text-xs text-zinc-400">Known facts only</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
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
                <p className="text-sm font-semibold tabular-nums text-zinc-950">
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

          <p className="pt-6 text-xs leading-5 text-zinc-500">
            Forecast spending is deliberately excluded from Safe to Spend. It
            remains separate because it is an estimate rather than a confirmed
            obligation.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
