"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { normaliseTransactions, parseAibCsv } from "@/lib/import";
import type { ImportResult, NormalisedTransaction } from "@/lib/import";

interface ImportedFileState {
  fileName: string;
  result: ImportResult;
  transactions: NormalisedTransaction[];
}

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

export default function ImportTransactionsPage() {
  const [importedFile, setImportedFile] = useState<ImportedFileState | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);

  const [isReading, setIsReading] = useState(false);

  const merchantSummary = useMemo(() => {
    if (!importedFile) {
      return [];
    }

    const merchants = new Map<
      string,
      {
        name: string;
        count: number;
        total: number;
      }
    >();

    importedFile.transactions.forEach((transaction) => {
      const existing = merchants.get(transaction.merchantName);

      if (existing) {
        existing.count += 1;
        existing.total += transaction.amount;
        return;
      }

      merchants.set(transaction.merchantName, {
        name: transaction.merchantName,
        count: 1,
        total: transaction.amount,
      });
    });

    return [...merchants.values()]
      .sort((first, second) => second.count - first.count)
      .slice(0, 8);
  }, [importedFile]);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setError(null);
    setImportedFile(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please choose an AIB transaction export in CSV format.");
      return;
    }

    setIsReading(true);

    try {
      const csv = await file.text();
      const result = parseAibCsv(csv);

      if (result.transactions.length === 0) {
        setError(
          "No transactions were found. Check that this is an AIB transaction export.",
        );
        return;
      }

      const transactions = normaliseTransactions(result.transactions);

      setImportedFile({
        fileName: file.name,
        result,
        transactions,
      });
    } catch {
      setError(
        "The file could not be read. Please try exporting it from AIB again.",
      );
    } finally {
      setIsReading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);

    event.target.value = "";
  }

  const moneyIn =
    importedFile?.transactions
      .filter((transaction) => transaction.amount > 0)
      .reduce((total, transaction) => total + transaction.amount, 0) ?? 0;

  const moneyOut =
    importedFile?.transactions
      .filter((transaction) => transaction.amount < 0)
      .reduce(
        (total, transaction) => total + Math.abs(transaction.amount),
        0,
      ) ?? 0;

  const previewTransactions =
    importedFile?.transactions
      .slice()
      .sort((first, second) =>
        second.postedDate.localeCompare(first.postedDate),
      )
      .slice(0, 8) ?? [];

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm text-zinc-500">Settings</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Import transactions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Import an AIB transaction export to preview the transactions the
            finance engine can understand.
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
            <div className="mx-auto max-w-md">
              <p className="text-lg font-semibold text-zinc-950">
                Import AIB CSV
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Download a transaction export from AIB, then select it below.
                Nothing is saved or applied to your dashboard yet.
              </p>

              <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800">
                {isReading ? "Reading file…" : "Choose CSV file"}

                <input
                  type="file"
                  accept=".csv,text/csv"
                  disabled={isReading}
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>

              {importedFile && (
                <p className="mt-3 text-xs text-zinc-500">
                  {importedFile.fileName}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-900">
                Import unsuccessful
              </p>

              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}
        </section>

        {importedFile && (
          <>
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm text-zinc-500">Import complete</p>

                <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
                  {importedFile.transactions.length} transactions found
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  The file was parsed and normalised successfully. These
                  transactions have not yet changed the dashboard.
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Transactions</p>

                  <p className="mt-1 text-2xl font-semibold">
                    {importedFile.transactions.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Money in</p>

                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(moneyIn)}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Money out</p>

                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(moneyOut)}
                  </p>
                </div>
              </div>

              {importedFile.result.warnings.length > 0 && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-950">
                    {importedFile.result.warnings.length} import warnings
                  </p>

                  <div className="mt-3 space-y-2">
                    {importedFile.result.warnings
                      .slice(0, 5)
                      .map((warning, index) => (
                        <p
                          key={`${warning.code}-${warning.row ?? index}`}
                          className="text-sm text-amber-800"
                        >
                          {warning.row ? `Row ${warning.row}: ` : ""}
                          {warning.message}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm text-zinc-500">Detected merchants</p>

                  <h2 className="mt-1 text-xl font-semibold">Most frequent</h2>
                </div>

                <div className="mt-5 divide-y divide-zinc-100">
                  {merchantSummary.map((merchant) => (
                    <div
                      key={merchant.name}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-950">
                          {merchant.name}
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          {merchant.count}{" "}
                          {merchant.count === 1
                            ? "transaction"
                            : "transactions"}
                        </p>
                      </div>

                      <p className="text-sm font-medium text-zinc-700">
                        {formatCurrency(merchant.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm text-zinc-500">Transaction preview</p>

                  <h2 className="mt-1 text-xl font-semibold">Most recent</h2>
                </div>

                <div className="mt-5 divide-y divide-zinc-100">
                  {previewTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-950">
                          {transaction.merchantName}
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          {formatDate(transaction.postedDate)}
                        </p>
                      </div>

                      <p
                        className={
                          transaction.amount >= 0
                            ? "text-sm font-medium text-emerald-700"
                            : "text-sm font-medium text-zinc-950"
                        }
                      >
                        {transaction.amount >= 0 ? "+" : "−"}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
