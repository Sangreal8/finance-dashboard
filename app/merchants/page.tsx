"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildMerchantLibrarySummary,
  loadMerchantDefinitions,
  removeMerchantDefinition,
  saveMerchantDefinition,
} from "@/lib/merchants";
import { loadAibImportSnapshot } from "@/lib/import";
import type {
  MerchantCategory,
  MerchantDefinition,
  MerchantLibrarySummary,
  MerchantProfile,
} from "@/lib/merchants";

const merchantCategories: MerchantCategory[] = [
  "Income",
  "Groceries",
  "Bills",
  "Fuel",
  "Eating out",
  "Shopping",
  "Legal",
  "Savings",
  "Other",
  "Uncategorised",
];

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

interface MerchantEditorProps {
  merchant: MerchantProfile;
  onSave: (definition: MerchantDefinition) => void;
  onReset: (merchantId: string) => void;
  onClose: () => void;
}

function MerchantEditor({
  merchant,
  onSave,
  onReset,
  onClose,
}: MerchantEditorProps) {
  const [category, setCategory] = useState<MerchantCategory>(merchant.category);

  const [recurring, setRecurring] = useState(merchant.recurring);

  const [includeInForecast, setIncludeInForecast] = useState(
    merchant.includeInForecast,
  );

  const [ignored, setIgnored] = useState(merchant.ignored);

  function handleSave() {
    onSave({
      merchantId: merchant.id,
      category,
      recurring,
      includeInForecast,
      ignored,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">Merchant knowledge</p>

            <h2 className="mt-1 text-2xl font-semibold">{merchant.name}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-zinc-950">Category</span>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as MerchantCategory)
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
            >
              {merchantCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3">
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 p-4">
              <div>
                <p className="text-sm font-medium">Recurring merchant</p>

                <p className="mt-1 text-xs text-zinc-500">
                  Payments from this merchant may represent a repeating cost.
                </p>
              </div>

              <input
                type="checkbox"
                checked={recurring}
                onChange={(event) => setRecurring(event.target.checked)}
                className="h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 p-4">
              <div>
                <p className="text-sm font-medium">Include in forecasts</p>

                <p className="mt-1 text-xs text-zinc-500">
                  Historical spending here can inform future spending estimates.
                </p>
              </div>

              <input
                type="checkbox"
                checked={includeInForecast}
                onChange={(event) => setIncludeInForecast(event.target.checked)}
                className="h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 p-4">
              <div>
                <p className="text-sm font-medium">Ignore merchant</p>

                <p className="mt-1 text-xs text-zinc-500">
                  Exclude internal transfers or irrelevant activity from
                  analysis.
                </p>
              </div>

              <input
                type="checkbox"
                checked={ignored}
                onChange={(event) => setIgnored(event.target.checked)}
                className="h-4 w-4"
              />
            </label>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-sm font-medium">What the app knows</p>

            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-zinc-500">Transactions</dt>
                <dd className="mt-1 font-medium">
                  {merchant.transactionCount}
                </dd>
              </div>

              <div>
                <dt className="text-zinc-500">Total spent</dt>
                <dd className="mt-1 font-medium">
                  {formatCurrency(merchant.totalSpent)}
                </dd>
              </div>

              <div>
                <dt className="text-zinc-500">First seen</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(merchant.firstSeen)}
                </dd>
              </div>

              <div>
                <dt className="text-zinc-500">Last seen</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(merchant.lastSeen)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => onReset(merchant.id)}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Reset to inferred
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save merchant
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MerchantsPage() {
  const [library, setLibrary] = useState<MerchantLibrarySummary | null>(null);

  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState("");

  const [showUncategorisedOnly, setShowUncategorisedOnly] = useState(false);

  function rebuildLibrary() {
    const importedSnapshot = loadAibImportSnapshot();

    if (!importedSnapshot) {
      setLibrary(null);
      return;
    }

    const definitions = loadMerchantDefinitions();

    setLibrary(
      buildMerchantLibrarySummary(importedSnapshot.transactions, definitions),
    );
  }

  useEffect(() => {
    rebuildLibrary();
  }, []);

  const selectedMerchant =
    library?.merchants.find((merchant) => merchant.id === selectedMerchantId) ??
    null;

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

  function handleSave(definition: MerchantDefinition) {
    saveMerchantDefinition(definition);

    rebuildLibrary();
    setSelectedMerchantId(null);
  }

  function handleReset(merchantId: string) {
    removeMerchantDefinition(merchantId);

    rebuildLibrary();
    setSelectedMerchantId(null);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm text-zinc-500">Intelligence</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Merchant library
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Teach the app how merchants should be categorised and used
            throughout your financial model.
          </p>
        </header>

        {!library && (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold">
              No imported transactions yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
              Import an AIB transaction file first. The merchant library will
              then be generated automatically.
            </p>

            <a
              href="/settings/import"
              className="mt-6 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
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
                <p className="text-sm text-zinc-500">Needs teaching</p>
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
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowUncategorisedOnly((current) => !current)
                    }
                    className={
                      showUncategorisedOnly
                        ? "rounded-xl bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
                        : "rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    }
                  >
                    Needs teaching
                  </button>
                </div>
              </div>

              <div className="mt-6 divide-y divide-zinc-100">
                {filteredMerchants.map((merchant) => (
                  <button
                    key={merchant.id}
                    type="button"
                    onClick={() => setSelectedMerchantId(merchant.id)}
                    className="grid w-full gap-4 py-5 text-left first:pt-0 last:pb-0 hover:bg-zinc-50 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">
                          {merchant.name}
                        </p>

                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                          {merchant.category}
                        </span>

                        {merchant.userDefined && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                            Taught
                          </span>
                        )}

                        {merchant.ignored && (
                          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] text-zinc-600">
                            Ignored
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-zinc-500">
                        {merchant.transactionCount}{" "}
                        {merchant.transactionCount === 1
                          ? "transaction"
                          : "transactions"}
                        {" · "}
                        Last seen {formatDate(merchant.lastSeen)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-500">Average outgoing</p>
                        <p className="mt-1 font-medium">
                          {merchant.outgoingTransactionCount > 0
                            ? formatCurrency(merchant.averageOutgoingAmount)
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-500">Total spent</p>
                        <p className="mt-1 font-medium">
                          {merchant.totalSpent > 0
                            ? formatCurrency(merchant.totalSpent)
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-zinc-500 md:text-right">
                      Edit
                    </p>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {selectedMerchant && (
        <MerchantEditor
          merchant={selectedMerchant}
          onSave={handleSave}
          onReset={handleReset}
          onClose={() => setSelectedMerchantId(null)}
        />
      )}
    </main>
  );
}
