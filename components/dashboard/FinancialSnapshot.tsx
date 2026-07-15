"use client";

import { useState } from "react";
import { SafeToSpendDialog } from "./SafeToSpendDialog";
import type { FinancialPosition, FinancialStatus } from "@/lib/finance/types";

interface FinancialSnapshotProps {
  position: FinancialPosition;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPaydayLabel(daysUntilPayday: number) {
  if (daysUntilPayday === 0) {
    return "Payday is today";
  }

  if (daysUntilPayday === 1) {
    return "1 day until payday";
  }

  return `${daysUntilPayday} days until payday`;
}

function getStatusAccent(status: FinancialStatus) {
  if (status.health === "healthy") {
    return "bg-emerald-500";
  }

  if (status.health === "warning") {
    return "bg-amber-500";
  }

  return "bg-red-500";
}

export function FinancialSnapshot({ position }: FinancialSnapshotProps) {
  const [calculationOpen, setCalculationOpen] = useState(false);

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-6 pb-6 pt-6">
          <div className="flex items-start gap-4">
            <div
              className={`mt-1 h-10 w-1 rounded-full ${getStatusAccent(
                position.financialStatus,
              )}`}
            />

            <div>
              <p className="text-sm text-zinc-500">Today</p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                {position.financialStatus.title}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                {position.financialStatus.description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid border-t border-zinc-100 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-zinc-100 p-6 sm:border-r lg:border-b-0">
            <p className="text-sm text-zinc-500">Available today</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              {formatCurrency(position.availableToday)}
            </p>

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Cash currently available across the accounts included in your
              plan.
            </p>
          </div>

          <div className="border-b border-zinc-100 p-6 lg:border-b-0 lg:border-r">
            <p className="text-sm text-zinc-500">Known commitments</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              {formatCurrency(position.knownCommitments)}
            </p>

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Confirmed obligations still represented in the current plan.
            </p>
          </div>

          <div className="border-b border-zinc-100 bg-zinc-50/70 p-6 sm:border-r lg:border-b-0">
            <p className="text-sm font-medium text-zinc-700">Safe to Spend</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              {formatCurrency(position.safeToSpend)}
            </p>

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Known commitments, reserves and your safety buffer are protected.
            </p>

            <button
              type="button"
              onClick={() => setCalculationOpen(true)}
              className="mt-3 text-xs font-semibold text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-950"
            >
              View calculation
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-zinc-500">Daily budget</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              {formatCurrency(position.dailyBudget)}

              <span className="ml-1 text-base font-medium text-zinc-500">
                / day
              </span>
            </p>

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              {getPaydayLabel(position.daysUntilPayday)}
            </p>
          </div>
        </div>
      </section>

      <SafeToSpendDialog
        open={calculationOpen}
        onOpenChange={setCalculationOpen}
        position={position}
      />
    </>
  );
}
