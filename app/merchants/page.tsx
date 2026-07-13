"use client";

import { useEffect, useMemo, useState } from "react";
import { buildMerchantLibrarySummary } from "@/lib/merchants";
import { loadAibImportSnapshot } from "@/lib/import";
import type {
  MerchantCategory,
  MerchantLibrarySummary,
  MerchantProfile,
} from "@/lib/merchants";

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

function getCategoryClasses(category: MerchantCategory) {
  if (category === "Uncategorised") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-zinc-100 text-zinc-600";
}

function MerchantRow({ merchant }: { merchant: MerchantProfile }) {
  return (
    <article className="grid gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-semibold text-zinc-950">
            {merchant.name}
          </h2>

          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getCategoryClasses(
              merchant.category,
            )}`}
          >
            {merchant.category}
          </span>

          {merchant.recurring && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              Recurring candidate
            </span>
          )}

          {merchant.includeInForecast && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Forecast
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-zinc-500">
          {merchant.transactionCount}{" "}
          {merchant.transactionCount === 1 ? "transaction" : "transactions"}
          {" · "}
          Last seen {formatDate(merchant.lastSeen)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-zinc-500">Average outgoing</p>

          <p className="mt-1 font-medium text-zinc-950">
            {merchant.outgoingTransactionCount > 0
              ? formatCurrency(merchant.averageOutgoingAmount)
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-zinc-500">Total spent</p>

          <p className="mt-1 font-medium text-zinc-950">
            {merchant.totalSpent > 0
              ? formatCurrency(merchant.totalSpent)
              : "—"}
          </p>
        </div>
      </div>

      <div className="text-sm md:text-right">
        <p className="text-zinc-500">First seen</p>

        <p className="mt-1 font-medium text-zinc-950">
          {formatDate(merchant.firstSeen)}
        </p>
      </div>
    </article>
  );
}

export default function MerchantsPage() {
  const [library, setLibrary] = useState<MerchantLibrarySummary | null>(null);

  const [search, setSearch] = useState("");

  const [showUncategorisedOnly, setShowUncategorisedOnly] = useState(false);

  useEffect(() => {
    const importedSnapshot = loadAibImportSnapshot();

    if (!importedSnapshot) {
      return;
    }

    setLibrary(buildMerchantLibrarySummary(importedSnapshot.transactions));
  }, []);

  const filteredMerchants = useMemo(() => {
    if (!library) {
      return [];
    }

    const searchTerm = search.trim().toLowerCase();

    return library.merchants.filter((merchant) => {
      if (showUncategorisedOnly && merchant.category !== "Uncategorised") {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return (
        merchant.name.toLowerCase().includes(searchTerm) ||
        merchant.category.toLowerCase().includes(searchTerm) ||
        merchant.rawDescriptions.some((description) =>
          description.toLowerCase().includes(searchTerm),
        )
      );
    });
  }, [library, search, showUncategorisedOnly]);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm text-zinc-500">Intelligence</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Merchant library
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            A reusable view of the merchants discovered from your imported
            transactions.
          </p>
        </header>

        {!library && (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold">
              No imported transactions yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
              Import an AIB transaction file first. The merchant library will
              then be generated automatically from the stored transactions.
            </p>

            <a
              href="/settings/import"
              className="mt-6 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Import transactions
            </a>
          </section>
        )}

        {library && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Merchants found</p>

                <p className="mt-1 text-3xl font-semibold">
                  {library.totalMerchants}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Recognised</p>

                <p className="mt-1 text-3xl font-semibold">
                  {library.recognisedMerchants}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Uncategorised</p>

                <p className="mt-1 text-3xl font-semibold">
                  {library.uncategorisedMerchants}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Forecast contributors</p>

                <p className="mt-1 text-3xl font-semibold">
                  {library.forecastMerchants}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-zinc-500">
                    Known financial behaviour
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">Merchants</h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search merchants"
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowUncategorisedOnly((current) => !current)
                    }
                    className={
                      showUncategorisedOnly
                        ? "rounded-xl bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
                        : "rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    }
                  >
                    Uncategorised only
                  </button>
                </div>
              </div>

              <div className="mt-6 divide-y divide-zinc-100">
                {filteredMerchants.map((merchant) => (
                  <MerchantRow key={merchant.id} merchant={merchant} />
                ))}

                {filteredMerchants.length === 0 && (
                  <p className="py-8 text-center text-sm text-zinc-500">
                    No merchants match the current filters.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
