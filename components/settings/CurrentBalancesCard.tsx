"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  clearAccountBalanceOverride,
  loadBalanceOverridesSnapshot,
  saveAccountBalanceOverride,
} from "@/lib/balances";
import { loadAibImportSnapshot, loadRevolutImportSnapshot } from "@/lib/import";
import type {
  StoredAibImportSnapshot,
  StoredRevolutImportSnapshot,
} from "@/lib/import";
import type { AccountBalanceOverride } from "@/lib/balances";

const AIB_ACCOUNT_ID = "aib-current";
const REVOLUT_ACCOUNT_ID = "revolut-current";

interface BalanceAccount {
  accountId: string;
  name: string;
  importedBalance?: number;
  override?: AccountBalanceOverride;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function parseBalanceInput(value: string) {
  const normalised = value.trim().replace(/\s/g, "").replace(",", ".");

  if (!normalised) {
    return null;
  }

  const parsed = Number(normalised);

  return Number.isFinite(parsed) ? parsed : null;
}

function getRevolutImportedBalance(
  snapshot: StoredRevolutImportSnapshot | null,
) {
  return snapshot?.latestBalances[REVOLUT_ACCOUNT_ID];
}

interface AccountBalanceEditorProps {
  account: BalanceAccount;
  onSaved: () => void;
  onCleared: () => void;
}

function AccountBalanceEditor({
  account,
  onSaved,
  onCleared,
}: AccountBalanceEditorProps) {
  const [value, setValue] = useState(
    account.override ? String(account.override.balance) : "",
  );

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedBalance = parseBalanceInput(value);

    if (parsedBalance === null) {
      setError("Enter a valid current balance.");

      return;
    }

    saveAccountBalanceOverride(account.accountId, parsedBalance);

    setError(null);
    setSaved(true);
    onSaved();

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  function handleClear() {
    clearAccountBalanceOverride(account.accountId);

    setError(null);
    setSaved(false);
    onCleared();
  }

  const effectiveBalance = account.override?.balance ?? account.importedBalance;

  const difference =
    account.override && account.importedBalance !== undefined
      ? account.override.balance - account.importedBalance
      : null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-zinc-950">{account.name}</h3>

            <span
              className={
                account.override
                  ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                  : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
              }
            >
              {account.override
                ? "Current balance active"
                : "Using imported balance"}
            </span>
          </div>

          {account.importedBalance !== undefined ? (
            <p className="mt-2 text-sm text-zinc-500">
              Imported statement balance{" "}
              <span className="font-medium text-zinc-800">
                {formatCurrency(account.importedBalance)}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              No imported balance is currently available for this account.
            </p>
          )}
        </div>

        {effectiveBalance !== undefined && (
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Used by dashboard
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
              {formatCurrency(effectiveBalance)}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-5">
        <label
          htmlFor={`${account.accountId}-balance`}
          className="text-sm font-medium text-zinc-800"
        >
          Current balance today
        </label>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-500">
              €
            </span>

            <input
              id={`${account.accountId}-balance`}
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
                setSaved(false);
              }}
              placeholder={
                account.importedBalance !== undefined
                  ? account.importedBalance.toFixed(2)
                  : "0.00"
              }
              className="h-10 w-full rounded-xl border border-zinc-300 bg-white pl-8 pr-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <button
            type="submit"
            className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Save current balance
          </button>

          {account.override && (
            <button
              type="button"
              onClick={handleClear}
              className="h-10 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
            >
              Clear override
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

        {saved && (
          <p className="mt-2 text-sm text-emerald-700">
            Current balance saved.
          </p>
        )}
      </form>

      {account.override && (
        <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3">
          <p className="text-xs text-zinc-500">
            Confirmed {formatDateTime(account.override.updatedAt)}
          </p>

          {difference !== null && (
            <p className="mt-1 text-sm text-zinc-700">
              Activity not yet represented in the imported statement:{" "}
              <span className="font-medium">
                {difference > 0 ? "+" : ""}
                {formatCurrency(difference)}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function CurrentBalancesCard() {
  const [aibSnapshot, setAibSnapshot] =
    useState<StoredAibImportSnapshot | null>(null);

  const [revolutSnapshot, setRevolutSnapshot] =
    useState<StoredRevolutImportSnapshot | null>(null);

  const [overrides, setOverrides] = useState<
    Record<string, AccountBalanceOverride>
  >({});

  function reloadState() {
    setAibSnapshot(loadAibImportSnapshot());

    setRevolutSnapshot(loadRevolutImportSnapshot());

    setOverrides(loadBalanceOverridesSnapshot().overrides);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(reloadState, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const accounts: BalanceAccount[] = [
    {
      accountId: AIB_ACCOUNT_ID,
      name: "AIB Current",
      importedBalance: aibSnapshot?.latestBalance,
      override: overrides[AIB_ACCOUNT_ID],
    },
    {
      accountId: REVOLUT_ACCOUNT_ID,
      name: "Revolut Current",
      importedBalance: getRevolutImportedBalance(revolutSnapshot),
      override: overrides[REVOLUT_ACCOUNT_ID],
    },
  ];

  const activeOverrideCount = accounts.filter(
    (account) => account.override,
  ).length;

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Current balances</p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
            Confirm today&apos;s cash
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Statement imports provide your transaction history. Current balances
            let the dashboard reflect activity that has happened since the
            latest export without inventing transactions.
          </p>
        </div>

        <span
          className={
            activeOverrideCount > 0
              ? "w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800"
              : "w-fit rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600"
          }
        >
          {activeOverrideCount === 0
            ? "Using imported balances"
            : `${activeOverrideCount} current ${
                activeOverrideCount === 1 ? "balance" : "balances"
              } active`}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {accounts.map((account) => (
          <AccountBalanceEditor
            key={`${account.accountId}:${account.override?.updatedAt ?? "imported"}`}
            account={account}
            onSaved={reloadState}
            onCleared={reloadState}
          />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
        <p className="text-sm font-medium text-zinc-950">
          These balances affect the dashboard only
        </p>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          They do not create transactions or alter spending analytics. Clear an
          override when the imported statement balance has caught up with the
          banking app.
        </p>
      </div>
    </section>
  );
}
