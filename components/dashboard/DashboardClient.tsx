"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { FinancialSnapshot } from "./FinancialSnapshot";
import { ReservedMoneyCard } from "./ReservedMoneyCard";
import { UpcomingTimeline } from "./UpcomingTimeline";
import type {
  FinanceTimelineEvent,
  FinancialPosition,
  Reserve,
} from "@/lib/finance/types";
import {
  clearAibImportSnapshot,
  clearRevolutImportSnapshot,
} from "@/lib/import";
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

function getSourceLabel(freshness: PlanningDataFreshness) {
  if (freshness.includesAib && freshness.includesRevolut) {
    return "AIB + Revolut";
  }

  if (freshness.includesAib) {
    return "AIB";
  }

  if (freshness.includesRevolut) {
    return "Revolut";
  }

  return "imported data";
}

function getFreshnessLabel(freshness: PlanningDataFreshness) {
  if (freshness.source !== "combined-import" || !freshness.importedAt) {
    return null;
  }

  return `Updated from ${getSourceLabel(freshness)} ${formatImportTime(
    freshness.importedAt,
  )}`;
}

function getOverrideLabel(freshness: PlanningDataFreshness) {
  const overrides = freshness.balanceOverrides ?? [];

  if (overrides.length === 0) {
    return null;
  }

  if (overrides.length === 1 && overrides[0].accountId === "aib-current") {
    return "AIB current balance confirmed";
  }

  if (overrides.length === 1 && overrides[0].accountId === "revolut-current") {
    return "Revolut current balance confirmed";
  }

  return "Current account balances confirmed";
}

export function DashboardClient({
  initialPosition,
  initialTimeline,
  reserves,
}: DashboardClientProps) {
  const [snapshot, setSnapshot] = useState<{
    position: FinancialPosition;
    timeline: FinanceTimelineEvent[];
    dataFreshness: PlanningDataFreshness;
  } | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const builtSnapshot = buildStoredPlanningSnapshot();

      setSnapshot({
        position: builtSnapshot.position,
        timeline: builtSnapshot.timeline,
        dataFreshness: builtSnapshot.dataFreshness,
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function refreshSnapshot() {
    const builtSnapshot = buildStoredPlanningSnapshot();

    setSnapshot({
      position: builtSnapshot.position,
      timeline: builtSnapshot.timeline,
      dataFreshness: builtSnapshot.dataFreshness,
    });
  }

  function resetImportedData() {
    clearAibImportSnapshot();
    clearRevolutImportSnapshot();
    refreshSnapshot();
  }

  const position = snapshot?.position ?? initialPosition;

  const timeline = snapshot?.timeline ?? initialTimeline;

  const dataFreshness = snapshot?.dataFreshness ?? {
    source: "manual" as const,
  };

  const freshnessLabel = getFreshnessLabel(dataFreshness);

  const overrideLabel = getOverrideLabel(dataFreshness);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Finance dashboard"
        title="Good evening, Josh"
        description="A calm view of what is already committed, what is still flexible, and what the month is likely to look like."
        actions={
          freshnessLabel || overrideLabel ? (
            <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-600 shadow-sm">
              {freshnessLabel && (
                <p className="font-medium text-zinc-950">{freshnessLabel}</p>
              )}

              {dataFreshness.latestTransactionDate && (
                <p className="mt-1 text-xs text-zinc-500">
                  Latest transaction{" "}
                  {formatDate(dataFreshness.latestTransactionDate)}
                </p>
              )}

              {overrideLabel && (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold">
                    ✓
                  </span>

                  <span>
                    {overrideLabel}
                    {dataFreshness.latestBalanceOverrideAt
                      ? ` ${formatImportTime(
                          dataFreshness.latestBalanceOverrideAt,
                        )}`
                      : ""}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={resetImportedData}
                className="mt-2 text-xs font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-950"
              >
                Use manual snapshot instead
              </button>
            </div>
          ) : null
        }
      />

      <FinancialSnapshot position={position} />

      <ReservedMoneyCard reserves={reserves} />

      <UpcomingTimeline events={timeline} />
    </PageShell>
  );
}
