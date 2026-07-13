"use client";

import { useEffect, useState } from "react";
import { FinancialSnapshot } from "./FinancialSnapshot";
import { ReservedMoneyCard } from "./ReservedMoneyCard";
import { UpcomingTimeline } from "./UpcomingTimeline";
import type {
  FinanceTimelineEvent,
  FinancialPosition,
  Reserve,
} from "@/lib/finance/types";
import { clearAibImportSnapshot } from "@/lib/import";
import { buildStoredPlanningSnapshot } from "@/lib/planning";
import type { PlanningDataFreshness } from "@/lib/planning";

interface DashboardClientProps {
  initialPosition: FinancialPosition;
  initialTimeline: FinanceTimelineEvent[];
  reserves: Reserve[];
}

function formatImportTime(importedAt: string) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(importedAt));
}

function getFreshnessLabel(freshness: PlanningDataFreshness) {
  if (freshness.source !== "aib-import" || !freshness.importedAt) {
    return null;
  }

  return `Updated from AIB ${formatImportTime(freshness.importedAt)}`;
}

export function DashboardClient({
  initialPosition,
  initialTimeline,
  reserves,
}: DashboardClientProps) {
  const [position, setPosition] = useState(initialPosition);

  const [timeline, setTimeline] = useState(initialTimeline);

  const [dataFreshness, setDataFreshness] = useState<PlanningDataFreshness>({
    source: "manual",
  });

  useEffect(() => {
    const snapshot = buildStoredPlanningSnapshot();

    setPosition(snapshot.position);
    setTimeline(snapshot.timeline);
    setDataFreshness(snapshot.dataFreshness);
  }, []);

  function resetImportedData() {
    clearAibImportSnapshot();

    const snapshot = buildStoredPlanningSnapshot();

    setPosition(snapshot.position);
    setTimeline(snapshot.timeline);
    setDataFreshness(snapshot.dataFreshness);
  }

  const freshnessLabel = getFreshnessLabel(dataFreshness);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Finance Dashboard</p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Good evening, Josh
            </h1>
          </div>

          {freshnessLabel && (
            <div className="text-sm text-zinc-500 sm:text-right">
              <p>{freshnessLabel}</p>

              {dataFreshness.latestTransactionDate && (
                <p className="mt-1 text-xs">
                  Latest transaction{" "}
                  {new Intl.DateTimeFormat("en-IE", {
                    day: "numeric",
                    month: "short",
                  }).format(
                    new Date(`${dataFreshness.latestTransactionDate}T12:00:00`),
                  )}
                </p>
              )}

              <button
                type="button"
                onClick={resetImportedData}
                className="mt-1 text-xs font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950"
              >
                Use manual snapshot instead
              </button>
            </div>
          )}
        </header>

        <FinancialSnapshot position={position} />

        <ReservedMoneyCard reserves={reserves} />

        <UpcomingTimeline events={timeline} />
      </div>
    </main>
  );
}
