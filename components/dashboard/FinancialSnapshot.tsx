"use client";

import { useState } from "react";
import type {
  FinancialBreakdownRow,
  FinancialPosition,
} from "@/lib/finance/types";

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

function formatBreakdownAmount(row: FinancialBreakdownRow) {
  if (row.type === "starting" || row.type === "result") {
    return formatCurrency(row.amount);
  }

  return `−${formatCurrency(Math.abs(row.amount))}`;
}

export function FinancialSnapshot({ position }: FinancialSnapshotProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

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

        <button
          type="button"
          aria-expanded={isBreakdownOpen}
          aria-controls="safe-to-spend-breakdown"
          onClick={() => setIsBreakdownOpen((current) => !current)}
          className="-m-3 rounded-2xl p-3 text-left transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-500">Safe to spend</p>

              <p className="mt-1 text-3xl font-semibold text-zinc-950">
                {formatCurrency(position.safeToSpend)}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Keeps {formatCurrency(position.safetyBuffer)} untouched
              </p>
            </div>

            <span
              aria-hidden="true"
              className={`mt-1 text-sm text-zinc-400 transition-transform ${
                isBreakdownOpen ? "rotate-180" : ""
              }`}
            >
              ↓
            </span>
          </div>

          <p className="mt-3 text-xs font-medium text-zinc-600">
            {isBreakdownOpen ? "Hide calculation" : "See calculation"}
          </p>
        </button>

        <div>
          <p className="text-sm text-zinc-500">Projected month end</p>

          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(position.projectedMonthEnd)}
          </p>
        </div>
      </div>

      {isBreakdownOpen && (
        <div
          id="safe-to-spend-breakdown"
          className="mt-6 border-t border-zinc-100 pt-6"
        >
          <div>
            <p className="text-sm font-medium text-zinc-950">
              How Safe to Spend is calculated
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Everything already spoken for is removed from the money available
              today.
            </p>
          </div>

          <div className="mt-5">
            {position.breakdown.map((row) => {
              const isResult = row.type === "result";

              return (
                <div
                  key={row.id}
                  className={
                    isResult
                      ? "mt-3 flex items-center justify-between border-t border-zinc-200 pt-4"
                      : "flex items-center justify-between py-2"
                  }
                >
                  <p
                    className={
                      isResult
                        ? "font-semibold text-zinc-950"
                        : "text-sm text-zinc-600"
                    }
                  >
                    {row.label}
                  </p>

                  <p
                    className={
                      isResult
                        ? "text-lg font-semibold text-zinc-950"
                        : row.type === "starting"
                          ? "text-sm font-medium text-zinc-950"
                          : "text-sm font-medium text-zinc-600"
                    }
                  >
                    {formatBreakdownAmount(row)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
