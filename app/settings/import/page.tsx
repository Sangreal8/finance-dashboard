"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { monthlyPlan } from "@/data/monthlyPlan";
import {
  normaliseTransactions,
  parseAibCsv,
  readXlsxWorkbook,
  saveAibImportSnapshot,
} from "@/lib/import";
import {
  buildReconciliationSummary,
  reconcileCommitments,
} from "@/lib/reconciliation";
import type {
  ImportResult,
  NormalisedTransaction,
  TransactionKind,
  XlsxWorkbook,
} from "@/lib/import";
import type { ReconciliationSummary } from "@/lib/reconciliation";

interface RevolutWorkbookState {
  fileName: string;
  workbook: XlsxWorkbook;
}

const REVOLUT_REQUIRED_HEADERS = [
  "Type",
  "Product",
  "Started Date",
  "Completed Date",
  "Description",
  "Amount",
  "Fee",
  "Currency",
  "State",
  "Balance",
];

interface ImportedFileState {
  fileName: string;
  result: ImportResult;
  transactions: NormalisedTransaction[];
  reconciliation: ReconciliationSummary;
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

function formatPreviewValue(value: unknown) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-IE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(value);
  }

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function getKindLabel(kind: TransactionKind) {
  const labels: Record<TransactionKind, string> = {
    purchase: "Purchase",
    income: "Income",
    transfer: "Transfer",
    fee: "Fee",
    refund: "Refund",
    unknown: "Needs review",
  };

  return labels[kind];
}

export default function ImportTransactionsPage() {
  const [importedFile, setImportedFile] = useState<ImportedFileState | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);

  const [isReading, setIsReading] = useState(false);

  const [revolutWorkbook, setRevolutWorkbook] =
    useState<RevolutWorkbookState | null>(null);

  const [revolutError, setRevolutError] = useState<string | null>(null);

  const [isReadingRevolut, setIsReadingRevolut] = useState(false);

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

      saveAibImportSnapshot(file.name, transactions);

      const matches = reconcileCommitments(
        monthlyPlan.commitments,
        transactions,
        {
          referenceDate: "2026-07-13",
        },
      );

      const reconciliation = buildReconciliationSummary(matches);

      setImportedFile({
        fileName: file.name,
        result,
        transactions,
        reconciliation,
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

  async function handleRevolutFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setRevolutError(null);
    setRevolutWorkbook(null);

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setRevolutError(
        "Please choose a Revolut account statement in XLSX format.",
      );

      return;
    }

    setIsReadingRevolut(true);

    try {
      const workbook = await readXlsxWorkbook(file);

      const missingHeaders = REVOLUT_REQUIRED_HEADERS.filter(
        (header) => !workbook.headers.includes(header),
      );

      if (missingHeaders.length > 0) {
        setRevolutError(
          `This does not look like a Revolut account statement. Missing columns: ${missingHeaders.join(
            ", ",
          )}.`,
        );

        return;
      }

      if (workbook.rows.length === 0) {
        setRevolutError(
          "The workbook was read, but it does not contain any transactions.",
        );

        return;
      }

      setRevolutWorkbook({
        fileName: file.name,
        workbook,
      });
    } catch (workbookError) {
      setRevolutError(
        workbookError instanceof Error
          ? workbookError.message
          : "The Revolut workbook could not be read.",
      );
    } finally {
      setIsReadingRevolut(false);
    }
  }

  function handleRevolutFileChange(event: ChangeEvent<HTMLInputElement>) {
    void handleRevolutFile(event.target.files?.[0]);

    event.target.value = "";
  }

  const summary = useMemo(() => {
    const transactions = importedFile?.transactions ?? [];

    const recognised = transactions.filter(
      (transaction) => transaction.recognised,
    );

    const needsReview = transactions.filter(
      (transaction) => !transaction.recognised,
    );

    const transfers = transactions.filter(
      (transaction) => transaction.kind === "transfer",
    );

    const purchases = transactions.filter(
      (transaction) =>
        transaction.kind === "purchase" || transaction.kind === "fee",
    );

    return {
      recognised,
      needsReview,
      transfers,
      purchases,
    };
  }, [importedFile]);

  const recognisedMerchants = useMemo(() => {
    const merchants = new Map<
      string,
      {
        name: string;
        count: number;
        total: number;
        kind: TransactionKind;
      }
    >();

    summary.recognised.forEach((transaction) => {
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
        kind: transaction.kind,
      });
    });

    return [...merchants.values()]
      .sort((first, second) => second.count - first.count)
      .slice(0, 10);
  }, [summary.recognised]);

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
      .slice(0, 10) ?? [];

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm text-zinc-500">Settings</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Import transactions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Import AIB transactions into the finance engine, or test that an
            official Revolut XLSX statement can be read before we wire in the
            full Revolut importer.
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
            <div className="mx-auto max-w-md">
              <p className="text-lg font-semibold text-zinc-950">
                Import AIB CSV
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Select an AIB transaction export. The file is analysed locally
                and saved in this browser for the dashboard.
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

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
            <div className="mx-auto max-w-md">
              <p className="text-lg font-semibold text-zinc-950">
                Test Revolut XLSX
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                This first step only reads and validates the workbook locally.
                It does not import, save, or display Revolut transactions
                elsewhere in the app yet.
              </p>

              <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800">
                {isReadingRevolut ? "Reading workbook…" : "Choose XLSX file"}

                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={isReadingRevolut}
                  onChange={handleRevolutFileChange}
                  className="sr-only"
                />
              </label>

              {revolutWorkbook && (
                <p className="mt-3 text-xs text-zinc-500">
                  {revolutWorkbook.fileName}
                </p>
              )}
            </div>
          </div>

          {revolutError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-900">
                Workbook test unsuccessful
              </p>

              <p className="mt-1 text-sm text-red-700">{revolutError}</p>
            </div>
          )}

          {revolutWorkbook && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-950">
                Revolut workbook read successfully
              </p>

              <p className="mt-1 text-sm text-emerald-800">
                {revolutWorkbook.workbook.rows.length} data rows and{" "}
                {revolutWorkbook.workbook.headers.length} columns found.
              </p>

              <div className="mt-4 overflow-x-auto rounded-xl border border-emerald-200 bg-white">
                <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
                  <thead className="bg-zinc-50">
                    <tr>
                      {revolutWorkbook.workbook.headers.map((header) => (
                        <th
                          key={header}
                          className="whitespace-nowrap px-3 py-2 font-medium text-zinc-600"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      {revolutWorkbook.workbook.headers.map((header) => (
                        <td
                          key={header}
                          className="whitespace-nowrap px-3 py-2 text-zinc-700"
                        >
                          {formatPreviewValue(
                            revolutWorkbook.workbook.rows[0]?.[header],
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {importedFile && (
          <>
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">Import complete</p>

              <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
                {importedFile.transactions.length} transactions found
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                The latest AIB balance and reconciled commitments are now
                available to the dashboard.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Recognised</p>

                  <p className="mt-1 text-2xl font-semibold">
                    {summary.recognised.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Needs review</p>

                  <p className="mt-1 text-2xl font-semibold">
                    {summary.needsReview.length}
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

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600">
                  {summary.transfers.length} transfers excluded from spending
                </span>

                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-600">
                  {summary.purchases.length} recognised purchases and fees
                </span>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-500">Reconciliation</p>

              <h2 className="mt-1 text-2xl font-semibold">
                Commitments checked
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Imported transactions were compared with the commitments
                expected in the current plan.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Paid</p>

                  <p className="mt-1 text-2xl font-semibold">
                    {importedFile.reconciliation.paid}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Upcoming</p>

                  <p className="mt-1 text-2xl font-semibold">
                    {importedFile.reconciliation.upcoming}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Overdue</p>

                  <p className="mt-1 text-2xl font-semibold">
                    {importedFile.reconciliation.overdue}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Remaining</p>

                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(
                      importedFile.reconciliation.remainingAmount,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 divide-y divide-zinc-100">
                {importedFile.reconciliation.matches.map((match) => (
                  <div
                    key={match.commitment.id}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-zinc-950">
                          {match.commitment.name}
                        </p>

                        <span
                          className={
                            match.status === "paid"
                              ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800"
                              : match.status === "overdue"
                                ? "rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-800"
                                : "rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600"
                          }
                        >
                          {match.status === "paid"
                            ? "Paid"
                            : match.status === "overdue"
                              ? "Overdue"
                              : "Upcoming"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-zinc-500">
                        Due {formatDate(match.commitment.dueDate)}
                        {match.transaction
                          ? ` · Matched to ${match.transaction.merchantName}`
                          : ""}
                      </p>
                    </div>

                    <p className="text-sm font-medium text-zinc-950">
                      {formatCurrency(match.commitment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-zinc-500">Recognised</p>

                <h2 className="mt-1 text-xl font-semibold">Known merchants</h2>

                <div className="mt-5 divide-y divide-zinc-100">
                  {recognisedMerchants.map((merchant) => (
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
                          {" · "}
                          {getKindLabel(merchant.kind)}
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
                <p className="text-sm text-zinc-500">Transaction preview</p>

                <h2 className="mt-1 text-xl font-semibold">Most recent</h2>

                <div className="mt-5 divide-y divide-zinc-100">
                  {previewTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-zinc-950">
                            {transaction.merchantName}
                          </p>

                          <span
                            className={
                              transaction.recognised
                                ? "rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600"
                                : "rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800"
                            }
                          >
                            {transaction.recognised
                              ? getKindLabel(transaction.kind)
                              : "Needs review"}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {formatDate(transaction.postedDate)}
                          {" · "}
                          {transaction.rawDescription}
                        </p>
                      </div>

                      <p
                        className={
                          transaction.amount >= 0
                            ? "shrink-0 text-sm font-medium text-emerald-700"
                            : "shrink-0 text-sm font-medium text-zinc-950"
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

            {summary.needsReview.length > 0 && (
              <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-zinc-500">Needs attention</p>

                <h2 className="mt-1 text-xl font-semibold">
                  Unrecognised descriptions
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  These are valid transactions, but the app does not yet have a
                  confident merchant rule for them.
                </p>

                <div className="mt-5 divide-y divide-zinc-100">
                  {summary.needsReview.slice(0, 10).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-950">
                          {transaction.rawDescription}
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          {formatDate(transaction.postedDate)}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-medium text-zinc-700">
                        {transaction.amount >= 0 ? "+" : "−"}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
