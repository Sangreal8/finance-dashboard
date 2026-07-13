"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyDefinitionsToTransactions,
  buildMerchantLibrary,
  loadMerchantDefinitions,
} from "@/lib/merchants";
import { buildSpendingProfileSummary } from "@/lib/forecasting";
import { loadAibImportSnapshot } from "@/lib/import";
import { CategoryProfileCard } from "@/components/spending/CategoryProfileCard";
import type {
  SpendingProfileConfidence,
  SpendingProfileSummary,
} from "@/lib/forecasting";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getConfidenceLabel(confidence: SpendingProfileConfidence) {
  const labels: Record<SpendingProfileConfidence, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };

  return labels[confidence];
}

function getConfidenceDescription(
  confidence: SpendingProfileConfidence,
  daysCovered: number,
) {
  if (confidence === "high") {
    return `Based on ${daysCovered} days of transaction history.`;
  }

  if (confidence === "medium") {
    return `Useful early estimate based on ${daysCovered} days of history.`;
  }

  return `Treat these figures cautiously. Only ${daysCovered} days of history are available.`;
}

export default function SpendingPage() {
  const [summary, setSummary] = useState<SpendingProfileSummary | null>(null);

  const [search, setSearch] = useState("");

  const [forecastCategoriesOnly, setForecastCategoriesOnly] = useState(false);

  useEffect(() => {
    const importedSnapshot = loadAibImportSnapshot();

    if (!importedSnapshot) {
      return;
    }

    const definitions = loadMerchantDefinitions();

    const merchantProfiles = buildMerchantLibrary(
      importedSnapshot.transactions,
      definitions,
    );

    const enrichedTransactions = applyDefinitionsToTransactions(
      importedSnapshot.transactions,
      definitions,
      merchantProfiles,
    );

    setSummary(buildSpendingProfileSummary(enrichedTransactions));
  }, []);

  const filteredProfiles = useMemo(() => {
    if (!summary) {
      return [];
    }

    const searchTerm = search.trim().toLowerCase();

    return summary.profiles.filter((profile) => {
      if (
        forecastCategoriesOnly &&
        !["Groceries", "Fuel", "Eating out"].includes(profile.category)
      ) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return (
        profile.category.toLowerCase().includes(searchTerm) ||
        profile.merchantNames.some((merchantName) =>
          merchantName.toLowerCase().includes(searchTerm),
        )
      );
    });
  }, [summary, search, forecastCategoriesOnly]);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm text-zinc-500">Insights</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Spending profiles
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Understand your normal spending patterns using enriched transaction
            history and saved merchant knowledge.
          </p>
        </header>

        {!summary && (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-950">
              No spending history available
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
              Import an AIB transaction file first. Spending profiles will then
              be generated automatically from recognised and categorised
              transactions.
            </p>

            <a
              href="/settings/import"
              className="mt-6 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Import transactions
            </a>
          </section>
        )}

        {summary && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Analysed spend</p>

                <p className="mt-1 text-3xl font-semibold text-zinc-950">
                  {formatCurrency(summary.totalSpent)}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Transactions</p>

                <p className="mt-1 text-3xl font-semibold text-zinc-950">
                  {summary.totalTransactions}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Categories</p>

                <p className="mt-1 text-3xl font-semibold text-zinc-950">
                  {summary.totalCategories}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Confidence</p>

                <p className="mt-1 text-3xl font-semibold text-zinc-950">
                  {getConfidenceLabel(summary.confidence)}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Analysis quality</p>

                  <h2 className="mt-1 text-xl font-semibold text-zinc-950">
                    {getConfidenceLabel(summary.confidence)} confidence
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                    {getConfidenceDescription(
                      summary.confidence,
                      summary.daysCovered,
                    )}
                  </p>
                </div>

                {summary.historyStartDate && summary.historyEndDate && (
                  <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm">
                    <p className="text-zinc-500">History window</p>

                    <p className="mt-1 font-medium text-zinc-950">
                      {formatDate(summary.historyStartDate)}
                      {" – "}
                      {formatDate(summary.historyEndDate)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Financial behaviour</p>

                  <h2 className="mt-1 text-xl font-semibold text-zinc-950">
                    Category profiles
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search categories"
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setForecastCategoriesOnly((current) => !current)
                    }
                    className={
                      forecastCategoriesOnly
                        ? "rounded-xl bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
                        : "rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    }
                  >
                    Forecast categories
                  </button>
                </div>
              </div>
            </section>

            <section className="grid gap-6">
              {filteredProfiles.map((profile) => (
                <CategoryProfileCard key={profile.category} profile={profile} />
              ))}

              {filteredProfiles.length === 0 && (
                <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
                  <p className="text-sm text-zinc-500">
                    No spending profiles match the current filters.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
