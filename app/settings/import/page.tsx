"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { CurrentBalancesCard } from "@/components/settings/CurrentBalancesCard";
import { buildMonthlyPlan } from "@/data/monthlyPlan";
import {
  normaliseTransactions,
  parseAibCsv,
  parseRevolutCsv,
  parseRevolutWorkbook,
  readXlsxWorkbook,
  saveAibImportSnapshot,
  saveRevolutImportSnapshot,
} from "@/lib/import";
import {
  buildReconciliationSummary,
  reconcileCommitments,
} from "@/lib/reconciliation";
import type {
  ImportResult,
  NormalisedTransaction,
  TransactionKind,
} from "@/lib/import";
import type { ReconciliationSummary } from "@/lib/reconciliation";

interface ImportedFileState {
  fileName: string;
  result: ImportResult;
  transactions: NormalisedTransaction[];
  reconciliation: ReconciliationSummary;
}

interface RevolutImportState {
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

function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
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

function getKindBadgeClass(kind: TransactionKind) {
  if (kind === "purchase") {
    return "bg-blue-100 text-blue-800";
  }

  if (kind === "transfer") {
    return "bg-zinc-100 text-zinc-600";
  }

  if (kind === "fee") {
    return "bg-amber-100 text-amber-800";
  }

  if (kind === "income" || kind === "refund") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-red-100 text-red-800";
}

export default function ImportTransactionsPage() {
  const [importedFile, setImportedFile] = useState<ImportedFileState | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);

  const [isReading, setIsReading] = useState(false);

  const [revolutImport, setRevolutImport] = useState<RevolutImportState | null>(
    null,
  );

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

      const referenceDate = formatLocalDate(new Date());
      const monthlyPlan = buildMonthlyPlan(referenceDate.slice(0, 7));

      const matches = reconcileCommitments(
        monthlyPlan.commitments,
        transactions,
        {
          referenceDate,
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
    setRevolutImport(null);

    const fileName = file.name.toLowerCase();

    const isCsv = fileName.endsWith(".csv");
    const isXlsx = fileName.endsWith(".xlsx");

    if (!isCsv && !isXlsx) {
      setRevolutError(
        "Please choose a Revolut account statement in CSV or XLSX format.",
      );

      return;
    }

    setIsReadingRevolut(true);

    try {
      const result = isCsv
        ? parseRevolutCsv(await file.text())
        : parseRevolutWorkbook(await readXlsxWorkbook(file));

      if (result.transactions.length === 0) {
        const parserMessage =
          result.warnings[0]?.message ??
          "No transactions were found in the Revolut statement.";

        setRevolutError(parserMessage);

        return;
      }

      const transactions = normaliseTransactions(result.transactions);

      saveRevolutImportSnapshot(file.name, transactions);

      setRevolutImport({
        fileName: file.name,
        result,
        transactions,
      });
    } catch (importError) {
      setRevolutError(
        importError instanceof Error
          ? importError.message
          : "The Revolut statement could not be read.",
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

  const revolutSummary = useMemo(() => {
    const transactions = revolutImport?.transactions ?? [];

    const moneyIn = transactions
      .filter((transaction) => transaction.amount > 0)
      .reduce((total, transaction) => total + transaction.amount, 0);

    const moneyOut = transactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);

    const transfers = transactions.filter(
      (transaction) => transaction.kind === "transfer",
    );

    const purchases = transactions.filter(
      (transaction) => transaction.kind === "purchase",
    );

    const fees = transactions.filter(
      (transaction) => transaction.kind === "fee",
    );

    const refunds = transactions.filter(
      (transaction) => transaction.kind === "refund",
    );

    const needsReview = transactions.filter(
      (transaction) => transaction.kind === "unknown",
    );

    return {
      moneyIn,
      moneyOut,
      transfers,
      purchases,
      fees,
      refunds,
      needsReview,
    };
  }, [revolutImport]);

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

  const revolutPreviewTransactions =
    revolutImport?.transactions
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
            Import AIB transactions into the finance engine, or import a Revolut
            account statement before saving it to the dashboard.
          </p>
        </header>

        <CurrentBalancesCard />

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
                Import Revolut statement
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Import an official Revolut account statement in CSV or XLSX
                format. The file is analysed locally and saved in this browser
                for the dashboard.
              </p>

              <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800">
                {isReadingRevolut
                  ? "Parsing statement…"
                  : "Choose CSV or XLSX file"}

                <input
                  type="file"
                  accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={isReadingRevolut}
                  onChange={handleRevolutFileChange}
                  className="sr-only"
                />
              </label>

              {revolutImport && (
                <p className="mt-3 text-xs text-zinc-500">
                  {revolutImport.fileName}
                </p>
              )}
            </div>
          </div>

          {revolutError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-900">
                Revolut import unsuccessful
              </p>

              <p className="mt-1 text-sm text-red-700">{revolutError}</p>
            </div>
          )}

          {revolutImport && (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-950">
                  Revolut statement imported successfully
                </p>

                <p className="mt-1 text-sm text-emerald-800">
                  {revolutImport.transactions.length} transactions were
                  converted and saved locally for the finance dashboard.
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-500">Revolut import</p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Statement summary
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Transactions</p>

                    <p className="mt-1 text-2xl font-semibold">
                      {revolutImport.transactions.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Accounts</p>

                    <p className="mt-1 text-2xl font-semibold">
                      {revolutImport.result.accounts.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Money in</p>

                    <p className="mt-1 text-2xl font-semibold">
                      {formatCurrency(revolutSummary.moneyIn)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Money out</p>

                    <p className="mt-1 text-2xl font-semibold">
                      {formatCurrency(revolutSummary.moneyOut)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Transfers</p>

                    <p className="mt-1 text-xl font-semibold">
                      {revolutSummary.transfers.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Purchases</p>

                    <p className="mt-1 text-xl font-semibold">
                      {revolutSummary.purchases.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Fees</p>

                    <p className="mt-1 text-xl font-semibold">
                      {revolutSummary.fees.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Refunds</p>

                    <p className="mt-1 text-xl font-semibold">
                      {revolutSummary.refunds.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Warnings</p>

                    <p className="mt-1 text-xl font-semibold">
                      {revolutImport.result.warnings.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-5">
                <p className="text-sm text-zinc-500">Accounts detected</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {revolutImport.result.accounts.map((account) => (
                    <span
                      key={account.externalAccountId ?? account.name}
                      className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700"
                    >
                      {account.name} · {account.currency}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-5">
                <p className="text-sm text-zinc-500">Transaction preview</p>

                <h3 className="mt-1 text-xl font-semibold">
                  Most recent Revolut activity
                </h3>

                <div className="mt-5 divide-y divide-zinc-100">
                  {revolutPreviewTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-zinc-950">
                            {transaction.merchantName}
                          </p>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${getKindBadgeClass(
                              transaction.kind,
                            )}`}
                          >
                            {getKindLabel(transaction.kind)}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {formatDate(transaction.postedDate)}
                          {" · "}
                          {transaction.rawDescription}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          {transaction.accountId === "revolut-savings"
                            ? "Revolut Savings"
                            : "Revolut Current"}
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

              {revolutImport.result.warnings.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-medium text-amber-950">
                    Parser warnings
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    These rows were skipped or imported with limited
                    classification.
                  </p>

                  <div className="mt-4 divide-y divide-amber-200">
                    {revolutImport.result.warnings
                      .slice(0, 10)
                      .map((warning, index) => (
                        <div
                          key={`${warning.code}-${warning.row ?? "file"}-${index}`}
                          className="py-3 text-sm text-amber-900 first:pt-0 last:pb-0"
                        >
                          {warning.row ? `Row ${warning.row}: ` : ""}
                          {warning.message}
                        </div>
                      ))}
                  </div>

                  {revolutImport.result.warnings.length > 10 && (
                    <p className="mt-4 text-xs text-amber-700">
                      Plus {revolutImport.result.warnings.length - 10}{" "}
                      additional warnings.
                    </p>
                  )}
                </div>
              )}

              {revolutSummary.needsReview.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <p className="text-sm font-medium text-red-950">
                    Transactions needing review
                  </p>

                  <p className="mt-1 text-sm text-red-800">
                    {revolutSummary.needsReview.length} transactions were
                    imported with an unknown transaction kind.
                  </p>
                </div>
              )}
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
                    className="py-5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-4">
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
                                  : match.status === "cancelled"
                                    ? "rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500"
                                    : "rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600"
                            }
                          >
                            {match.status === "paid"
                              ? "Paid"
                              : match.status === "overdue"
                                ? "Overdue"
                                : match.status === "cancelled"
                                  ? "Cancelled"
                                  : "Upcoming"}
                          </span>

                          {match.confidence !== "none" && (
                            <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500">
                              {match.confidence === "high"
                                ? "High-confidence match"
                                : "Review match"}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                          Due {formatDate(match.commitment.dueDate)}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-medium text-zinc-950">
                        {formatCurrency(match.commitment.amount)}
                      </p>
                    </div>

                    <div
                      className={
                        match.transaction
                          ? "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                          : match.status === "overdue"
                            ? "mt-4 rounded-2xl border border-red-200 bg-red-50 p-4"
                            : "mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                      }
                    >
                      <p
                        className={
                          match.transaction
                            ? "text-xs font-medium text-emerald-950"
                            : match.status === "overdue"
                              ? "text-xs font-medium text-red-950"
                              : "text-xs font-medium text-zinc-700"
                        }
                      >
                        {match.explanation}
                      </p>

                      {match.transaction && (
                        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                          <div>
                            <p className="text-zinc-500">Matched transaction</p>

                            <p className="mt-1 font-medium text-zinc-950">
                              {match.transaction.rawDescription}
                            </p>
                          </div>

                          <div>
                            <p className="text-zinc-500">Transaction details</p>

                            <p className="mt-1 font-medium text-zinc-950">
                              {formatDate(match.transaction.postedDate)}
                              {" · "}
                              {formatCurrency(
                                Math.abs(match.transaction.amount),
                              )}
                              {" · "}
                              {match.transaction.source === "aib"
                                ? "AIB"
                                : "Revolut"}
                            </p>
                          </div>

                          <div>
                            <p className="text-zinc-500">
                              Expected merchant patterns
                            </p>

                            <p className="mt-1 font-medium text-zinc-950">
                              {match.commitment.merchantPatterns?.join(" · ") ??
                                match.commitment.name}
                            </p>
                          </div>

                          <div>
                            <p className="text-zinc-500">Match distance</p>

                            <p className="mt-1 font-medium text-zinc-950">
                              {match.dateDifferenceDays === 0
                                ? "Paid on expected date"
                                : `${match.dateDifferenceDays ?? 0} ${
                                    match.dateDifferenceDays === 1
                                      ? "day"
                                      : "days"
                                  } from due date`}
                              {" · "}
                              {formatCurrency(match.amountDifference ?? 0)}{" "}
                              amount difference
                            </p>
                          </div>
                        </div>
                      )}

                      {!match.transaction && (
                        <div className="mt-3">
                          <p className="text-xs text-zinc-500">
                            Expected patterns
                          </p>

                          <p className="mt-1 text-xs font-medium text-zinc-800">
                            {match.commitment.merchantPatterns?.join(" · ") ??
                              match.commitment.name}
                          </p>
                        </div>
                      )}
                    </div>
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
