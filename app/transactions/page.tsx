"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildStoredPlanningSnapshot } from "@/lib/planning";
import type { EnrichedTransaction, MerchantCategory } from "@/lib/merchants";

type TransactionFilter =
  | "all"
  | "spending"
  | "income"
  | "transfers"
  | "needs-attention";

const categoryOptions: MerchantCategory[] = [
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

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getTransactionLabel(transaction: EnrichedTransaction) {
  if (transaction.kind === "transfer") {
    return "Transfer";
  }

  if (transaction.kind === "refund") {
    return "Refund";
  }

  if (transaction.kind === "fee") {
    return "Fee";
  }

  if (transaction.amount > 0) {
    return "Income";
  }

  if (transaction.category === "Uncategorised") {
    return "Needs teaching";
  }

  return transaction.category;
}

function getTransactionBadgeClasses(transaction: EnrichedTransaction) {
  if (
    transaction.category === "Uncategorised" &&
    transaction.kind !== "transfer"
  ) {
    return "bg-amber-100 text-amber-800";
  }

  if (transaction.kind === "transfer") {
    return "bg-blue-50 text-blue-700";
  }

  if (transaction.amount > 0) {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-zinc-100 text-zinc-600";
}

function isSpendingTransaction(transaction: EnrichedTransaction) {
  return (
    transaction.amount < 0 &&
    transaction.kind !== "transfer" &&
    transaction.kind !== "refund" &&
    !transaction.ignored
  );
}

function matchesPrimaryFilter(
  transaction: EnrichedTransaction,
  filter: TransactionFilter,
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "spending") {
    return isSpendingTransaction(transaction);
  }

  if (filter === "income") {
    return transaction.amount > 0 && transaction.kind !== "transfer";
  }

  if (filter === "transfers") {
    return transaction.kind === "transfer";
  }

  return (
    transaction.category === "Uncategorised" && transaction.kind !== "transfer"
  );
}

function TransactionRow({ transaction }: { transaction: EnrichedTransaction }) {
  const isPositive = transaction.amount >= 0;

  return (
    <article className="grid gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[110px_minmax(0,1fr)_160px_130px] md:items-center">
      <div>
        <p className="text-sm text-zinc-500">
          {formatDate(transaction.postedDate)}
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-950">
            {transaction.merchantName}
          </p>

          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getTransactionBadgeClasses(
              transaction,
            )}`}
          >
            {getTransactionLabel(transaction)}
          </span>

          {transaction.userDefined && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
              Taught
            </span>
          )}

          {transaction.ignored && (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
              Ignored
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-xs text-zinc-500">
          {transaction.rawDescription}
        </p>
      </div>

      <div className="text-sm">
        <p className="text-zinc-500">Account</p>

        <p className="mt-1 font-medium text-zinc-950">
          {transaction.accountId}
        </p>
      </div>

      <div className="md:text-right">
        <p
          className={
            isPositive
              ? "text-sm font-semibold text-emerald-700"
              : "text-sm font-semibold text-zinc-950"
          }
        >
          {isPositive ? "+" : "−"}
          {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
        </p>
      </div>
    </article>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);

  const [hasImportedData, setHasImportedData] = useState(false);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<TransactionFilter>("all");

  const [selectedCategory, setSelectedCategory] = useState<
    MerchantCategory | "all"
  >("all");

  useEffect(() => {
    const snapshot = buildStoredPlanningSnapshot();

    setTransactions(
      snapshot.transactions.slice().sort((first, second) => {
        const dateComparison = second.postedDate.localeCompare(
          first.postedDate,
        );

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return second.id.localeCompare(first.id);
      }),
    );

    setHasImportedData(snapshot.dataFreshness.source === "aib-import");
  }, []);

  const filteredTransactions = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      if (!matchesPrimaryFilter(transaction, filter)) {
        return false;
      }

      if (
        selectedCategory !== "all" &&
        transaction.category !== selectedCategory
      ) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return [
        transaction.merchantName,
        transaction.rawDescription,
        transaction.normalisedDescription,
        transaction.category,
        transaction.accountId,
      ].some((value) => value.toLowerCase().includes(searchTerm));
    });
  }, [transactions, search, filter, selectedCategory]);

  const summary = useMemo(() => {
    const spending = transactions
      .filter(isSpendingTransaction)
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);

    const income = transactions
      .filter(
        (transaction) =>
          transaction.amount > 0 && transaction.kind !== "transfer",
      )
      .reduce((total, transaction) => total + transaction.amount, 0);

    const transfers = transactions.filter(
      (transaction) => transaction.kind === "transfer",
    ).length;

    const needsAttention = transactions.filter(
      (transaction) =>
        transaction.category === "Uncategorised" &&
        transaction.kind !== "transfer",
    ).length;

    return {
      spending,
      income,
      transfers,
      needsAttention,
    };
  }, [transactions]);

  if (!hasImportedData) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">
          No imported transactions yet
        </h1>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
          Import an AIB transaction export to populate the live transaction
          history.
        </p>

        <Link
          href="/settings/import"
          className="mt-6 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Import transactions
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-zinc-500">Activity</p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
          Transactions
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Search, review and understand the enriched transactions used by the
          planning engine.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Spending analysed</p>

          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(summary.spending, "EUR")}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Money in</p>

          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(summary.income, "EUR")}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Internal transfers</p>

          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {summary.transfers}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Needs teaching</p>

          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {summary.needsAttention}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-zinc-500">Transaction history</p>

              <h2 className="mt-1 text-xl font-semibold text-zinc-950">
                {filteredTransactions.length}{" "}
                {filteredTransactions.length === 1
                  ? "transaction"
                  : "transactions"}
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search transactions"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
              />

              <select
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value as MerchantCategory | "all",
                  )
                }
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              >
                <option value="all">All categories</option>

                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
            {(
              [
                ["all", "All"],
                ["spending", "Spending"],
                ["income", "Money in"],
                ["transfers", "Transfers"],
                ["needs-attention", "Needs teaching"],
              ] as Array<[TransactionFilter, string]>
            ).map(([optionValue, optionLabel]) => (
              <button
                key={optionValue}
                type="button"
                onClick={() => setFilter(optionValue)}
                className={
                  filter === optionValue
                    ? "rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
                }
              >
                {optionLabel}
              </button>
            ))}

            <Link
              href="/merchants"
              className="ml-auto rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Manage merchants
            </Link>
          </div>
        </div>

        <div className="mt-6 divide-y divide-zinc-100">
          {filteredTransactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}

          {filteredTransactions.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-zinc-950">
                No transactions found
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Try changing the current search or filters.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
