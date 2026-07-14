import { ensureUniqueTransactionIds } from "./normalise";
import type { NormalisedTransaction } from "./types";

const AIB_IMPORT_STORAGE_KEY = "finance-dashboard:aib-import:v1";

const REVOLUT_IMPORT_STORAGE_KEY = "finance-dashboard:revolut-import:v1";

export interface StoredAibImportSnapshot {
  version: 1;
  source: "aib";
  fileName: string;
  importedAt: string;
  latestBalance?: number;
  transactions: NormalisedTransaction[];
}

export interface StoredRevolutImportSnapshot {
  version: 1;
  source: "revolut";
  fileName: string;
  importedAt: string;
  latestBalances: Record<string, number>;
  transactions: NormalisedTransaction[];
}

function findLatestBalance(
  transactions: NormalisedTransaction[],
): number | undefined {
  const transactionsWithBalances = transactions.filter(
    (
      transaction,
    ): transaction is NormalisedTransaction & {
      balanceAfter: number;
    } => typeof transaction.balanceAfter === "number",
  );

  if (transactionsWithBalances.length === 0) {
    return undefined;
  }

  const latestTransaction = transactionsWithBalances.reduce(
    (latest, transaction) => {
      if (transaction.postedDate >= latest.postedDate) {
        return transaction;
      }

      return latest;
    },
  );

  return latestTransaction.balanceAfter;
}

function findLatestBalancesByAccount(
  transactions: NormalisedTransaction[],
): Record<string, number> {
  const latestTransactions = new Map<
    string,
    NormalisedTransaction & {
      balanceAfter: number;
    }
  >();

  transactions.forEach((transaction) => {
    if (typeof transaction.balanceAfter !== "number") {
      return;
    }

    const existing = latestTransactions.get(transaction.accountId);

    if (!existing || transaction.postedDate >= existing.postedDate) {
      latestTransactions.set(
        transaction.accountId,
        transaction as NormalisedTransaction & {
          balanceAfter: number;
        },
      );
    }
  });

  return Object.fromEntries(
    [...latestTransactions.entries()].map(([accountId, transaction]) => [
      accountId,
      transaction.balanceAfter,
    ]),
  );
}

export function saveAibImportSnapshot(
  fileName: string,
  transactions: NormalisedTransaction[],
): StoredAibImportSnapshot {
  const dedupedTransactions = ensureUniqueTransactionIds(transactions);

  const snapshot: StoredAibImportSnapshot = {
    version: 1,
    source: "aib",
    fileName,
    importedAt: new Date().toISOString(),
    latestBalance: findLatestBalance(dedupedTransactions),
    transactions: dedupedTransactions,
  };

  window.localStorage.setItem(AIB_IMPORT_STORAGE_KEY, JSON.stringify(snapshot));

  return snapshot;
}

export function loadAibImportSnapshot(): StoredAibImportSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(AIB_IMPORT_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedValue) as StoredAibImportSnapshot;

    if (
      parsed.version !== 1 ||
      parsed.source !== "aib" ||
      !Array.isArray(parsed.transactions)
    ) {
      return null;
    }

    return {
      ...parsed,
      transactions: ensureUniqueTransactionIds(parsed.transactions),
    };
  } catch {
    return null;
  }
}

export function clearAibImportSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AIB_IMPORT_STORAGE_KEY);
}

export function saveRevolutImportSnapshot(
  fileName: string,
  transactions: NormalisedTransaction[],
): StoredRevolutImportSnapshot {
  const dedupedTransactions = ensureUniqueTransactionIds(transactions);

  const snapshot: StoredRevolutImportSnapshot = {
    version: 1,
    source: "revolut",
    fileName,
    importedAt: new Date().toISOString(),
    latestBalances: findLatestBalancesByAccount(dedupedTransactions),
    transactions: dedupedTransactions,
  };

  window.localStorage.setItem(
    REVOLUT_IMPORT_STORAGE_KEY,
    JSON.stringify(snapshot),
  );

  return snapshot;
}

export function loadRevolutImportSnapshot(): StoredRevolutImportSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(REVOLUT_IMPORT_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedValue) as StoredRevolutImportSnapshot;

    if (
      parsed.version !== 1 ||
      parsed.source !== "revolut" ||
      !Array.isArray(parsed.transactions) ||
      typeof parsed.latestBalances !== "object" ||
      parsed.latestBalances === null
    ) {
      return null;
    }

    return {
      ...parsed,
      transactions: ensureUniqueTransactionIds(parsed.transactions),
    };
  } catch {
    return null;
  }
}

export function clearRevolutImportSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(REVOLUT_IMPORT_STORAGE_KEY);
}
