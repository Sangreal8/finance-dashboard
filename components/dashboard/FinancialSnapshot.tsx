"use client";

import { useState } from "react";
import type { FinancialPosition } from "@/lib/finance/types";

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

export function FinancialSnapshot({ position }: FinancialSnapshotProps) {
  const [showCalculation, setShowCalculation] = useState(false);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm text-zinc-500">Today</p>

        <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
          {position.financialStatus.title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          {position.financialStatus.description}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-zinc-500">Available today</p>

          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(position.availableToday)}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Known commitments</p>

          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(position.knownCommitments)}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Safe to spend</p>

          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(position.safeToSpend)}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Keeps {formatCurrency(position.safetyBuffer)} untouched
          </p>

          <button
            type="button"
            onClick={() => setShowCalculation((current) => !current)}
            className="mt-2 text-xs font-medium text-zinc-700 hover:text-zinc-950"
          >
            {showCalculation ? "Hide calculation" : "See calculation"}
          </button>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Daily budget</p>

          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(position.dailyBudget)}
            <span className="ml-1 text-base font-medium text-zinc-500">
              / day
            </span>
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getPaydayLabel(position.daysUntilPayday)}
          </p>
        </div>
      </div>

      {showCalculation && (
        <div className="mt-6 border-t border-zinc-100 pt-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">
              How Safe to Spend is calculated
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Everything already spoken for is removed from the money available
              today.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {position.breakdown
              .filter((row) => row.type !== "result")
              .map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <p className="text-zinc-600">{row.label}</p>

                  <p className="font-medium text-zinc-950">
                    {row.amount < 0 ? "−" : ""}
                    {formatCurrency(Math.abs(row.amount))}
                  </p>
                </div>
              ))}

            <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
              <p className="font-semibold text-zinc-950">Safe to spend</p>

              <p className="text-lg font-semibold text-zinc-950">
                {formatCurrency(position.safeToSpend)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-950">
                  Daily budget
                </p>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Safe to Spend divided by the time remaining
                </p>
              </div>

              <p className="text-sm font-semibold text-zinc-950">
                {formatCurrency(position.safeToSpend)}
                {" ÷ "}
                {Math.max(position.daysUntilPayday, 1)}
                {" = "}
                {formatCurrency(position.dailyBudget)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
