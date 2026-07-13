import type {
  NormalisedTransaction,
} from "./types";

const AIB_IMPORT_STORAGE_KEY =
  "finance-dashboard:aib-import:v1";

export interface StoredAibImportSnapshot {
  version: 1;
  source: "aib";
  fileName: string;
  importedAt: string;
  latestBalance?: number;
  transactions: NormalisedTransaction[];
}

function findLatestBalance(
  transactions: NormalisedTransaction[]
): number | undefined {
  const transactionsWithBalances =
    transactions.filter(
      (
        transaction
      ): transaction is NormalisedTransaction & {
        balanceAfter: number;
      } =>
        typeof transaction.balanceAfter ===
        "number"
    );

  if (transactionsWithBalances.length === 0) {
    return undefined;
  }

  const latestTransaction =
    transactionsWithBalances.reduce(
      (latest, transaction) => {
        if (
          transaction.postedDate >
          latest.postedDate
        ) {
          return transaction;
        }

        return latest;
      }
    );

  return latestTransaction.balanceAfter;
}

export function saveAibImportSnapshot(
  fileName: string,
  transactions: NormalisedTransaction[]
): StoredAibImportSnapshot {
  const snapshot: StoredAibImportSnapshot = {
    version: 1,
    source: "aib",
    fileName,
    importedAt: new Date().toISOString(),
    latestBalance:
      findLatestBalance(transactions),
    transactions,
  };

  window.localStorage.setItem(
    AIB_IMPORT_STORAGE_KEY,
    JSON.stringify(snapshot)
  );

  return snapshot;
}

export function loadAibImportSnapshot():
  | StoredAibImportSnapshot
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue =
    window.localStorage.getItem(
      AIB_IMPORT_STORAGE_KEY
    );

  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      storedValue
    ) as StoredAibImportSnapshot;

    if (
      parsed.version !== 1 ||
      parsed.source !== "aib" ||
      !Array.isArray(parsed.transactions)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearAibImportSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(
    AIB_IMPORT_STORAGE_KEY
  );
}