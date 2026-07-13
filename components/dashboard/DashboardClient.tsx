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
import {
  clearAibImportSnapshot,
  loadAibImportSnapshot,
} from "@/lib/import/storage";
import { buildLiveFinanceSnapshot } from "@/lib/services/live-finance";

interface DashboardClientProps {
  initialPosition: FinancialPosition;
  initialTimeline: FinanceTimelineEvent[];
  reserves: Reserve[];
}

interface ImportMetadata {
  importedAt: string;
  sourceFileName: string;
}

function formatImportTime(importedAt: string) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(importedAt));
}

function getReferenceDate() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function DashboardClient({
  initialPosition,
  initialTimeline,
  reserves,
}: DashboardClientProps) {
  const [position, setPosition] = useState(initialPosition);

  const [timeline, setTimeline] = useState(initialTimeline);

  const [importMetadata, setImportMetadata] = useState<ImportMetadata | null>(
    null,
  );

  useEffect(() => {
    const importedSnapshot = loadAibImportSnapshot();

    if (!importedSnapshot) {
      return;
    }

    const liveSnapshot = buildLiveFinanceSnapshot(
      importedSnapshot,
      getReferenceDate(),
    );

    setPosition(liveSnapshot.position);
    setTimeline(liveSnapshot.timeline);

    setImportMetadata({
      importedAt: liveSnapshot.importedAt,
      sourceFileName: liveSnapshot.sourceFileName,
    });
  }, []);

  function resetImportedData() {
    clearAibImportSnapshot();

    setPosition(initialPosition);
    setTimeline(initialTimeline);
    setImportMetadata(null);
  }

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

          {importMetadata && (
            <div className="text-sm text-zinc-500 sm:text-right">
              <p>
                Updated from AIB {formatImportTime(importMetadata.importedAt)}
              </p>

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
