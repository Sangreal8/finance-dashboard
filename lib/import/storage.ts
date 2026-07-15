import { ensureUniqueTransactionIds } from "./normalise";
import type { NormalisedTransaction } from "./types";

const AIB_IMPORT_STORAGE_KEY = "finance-dashboard:aib-import:v1";

const REVOLUT_IMPORT_STORAGE_KEY = "finance-dashboard:revolut-import:v1";

export interface ImportMergeSummary {
  /**
   * Number of transactions supplied by the latest uploaded file.
   */
  importedCount: number;

  /**
   * Transactions not already present in stored history.
   */
  addedCount: number;

  /**
   * Transactions already present and recognised as overlap.
   */
  overlappingCount: number;

  /**
   * Total history retained after the merge.
   */
  totalStoredCount: number;
}

export interface StoredAibImportSnapshot {
  version: 1;
  source: "aib";
  fileName: string;
  importedAt: string;
  latestBalance?: number;
  lastImportSummary: ImportMergeSummary;
  transactions: NormalisedTransaction[];
}

export interface StoredRevolutImportSnapshot {
  version: 1;
  source: "revolut";
  fileName: string;
  importedAt: string;
  latestBalances: Record<string, number>;
  lastImportSummary: ImportMergeSummary;
  transactions: NormalisedTransaction[];
}

export interface StoredCombinedImportSnapshot {
  source: "combined-import";
  importedAt: string;
  sourceFileNames: string[];
  aib: StoredAibImportSnapshot | null;
  revolut: StoredRevolutImportSnapshot | null;
  transactions: NormalisedTransaction[];
}

interface TransactionMergeResult {
  transactions: NormalisedTransaction[];
  summary: ImportMergeSummary;
}

function getTransactionIdentity(transaction: NormalisedTransaction): string {
  return `${transaction.source}:${transaction.externalId}`;
}

function sortTransactions(
  transactions: NormalisedTransaction[],
): NormalisedTransaction[] {
  return transactions.slice().sort((first, second) => {
    const dateComparison = first.postedDate.localeCompare(second.postedDate);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const accountComparison = first.accountId.localeCompare(second.accountId);

    if (accountComparison !== 0) {
      return accountComparison;
    }

    return first.externalId.localeCompare(second.externalId);
  });
}

/**
 * Combines existing history with the latest imported file.
 *
 * Exact identities are deduplicated using source + externalId.
 * When the same transaction appears in both collections, the
 * newly imported version wins.
 */
function mergeTransactionHistory(
  existingTransactions: NormalisedTransaction[],
  importedTransactions: NormalisedTransaction[],
): TransactionMergeResult {
  const existingByIdentity = new Map<string, NormalisedTransaction>();

  existingTransactions.forEach((transaction) => {
    existingByIdentity.set(getTransactionIdentity(transaction), transaction);
  });

  const importedByIdentity = new Map<string, NormalisedTransaction>();

  importedTransactions.forEach((transaction) => {
    importedByIdentity.set(getTransactionIdentity(transaction), transaction);
  });

  let overlappingCount = 0;

  importedByIdentity.forEach((_transaction, identity) => {
    if (existingByIdentity.has(identity)) {
      overlappingCount += 1;
    }
  });

  const addedCount = importedByIdentity.size - overlappingCount;

  const mergedByIdentity = new Map(existingByIdentity);

  /**
   * Imported copies deliberately overwrite stored copies.
   * This allows the newest bank export to correct metadata
   * or normalisation for a transaction already in history.
   */
  importedByIdentity.forEach((transaction, identity) => {
    mergedByIdentity.set(identity, transaction);
  });

  const transactions = ensureUniqueTransactionIds(
    sortTransactions([...mergedByIdentity.values()]),
  );

  return {
    transactions,
    summary: {
      importedCount: importedTransactions.length,
      addedCount,
      overlappingCount,
      totalStoredCount: transactions.length,
    },
  };
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
      if (transaction.postedDate > latest.postedDate) {
        return transaction;
      }

      /**
       * Rows on the same date remain in their imported
       * order. Using the later row means the final running
       * balance for that date is retained.
       */
      if (transaction.postedDate === latest.postedDate) {
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

function getLatestImportedAt(
  snapshots: Array<StoredAibImportSnapshot | StoredRevolutImportSnapshot>,
): string {
  return snapshots.reduce(
    (latest, snapshot) =>
      snapshot.importedAt > latest ? snapshot.importedAt : latest,
    snapshots[0].importedAt,
  );
}

function getLegacyImportSummary(
  transactions: NormalisedTransaction[],
): ImportMergeSummary {
  return {
    importedCount: transactions.length,
    addedCount: transactions.length,
    overlappingCount: 0,
    totalStoredCount: transactions.length,
  };
}

export function saveAibImportSnapshot(
  fileName: string,
  transactions: NormalisedTransaction[],
): StoredAibImportSnapshot {
  const existingSnapshot = loadAibImportSnapshot();

  const mergeResult = mergeTransactionHistory(
    existingSnapshot?.transactions ?? [],
    transactions,
  );

  /**
   * The newest file is the source of truth for the current
   * balance. We deliberately do not derive it from older
   * retained history.
   */
  const latestImportedBalance = findLatestBalance(transactions);

  const snapshot: StoredAibImportSnapshot = {
    version: 1,
    source: "aib",
    fileName,
    importedAt: new Date().toISOString(),
    latestBalance: latestImportedBalance ?? existingSnapshot?.latestBalance,
    lastImportSummary: mergeResult.summary,
    transactions: mergeResult.transactions,
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

    const transactions = ensureUniqueTransactionIds(
      sortTransactions(parsed.transactions),
    );

    return {
      ...parsed,
      lastImportSummary:
        parsed.lastImportSummary ?? getLegacyImportSummary(transactions),
      transactions,
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
  const existingSnapshot = loadRevolutImportSnapshot();

  const mergeResult = mergeTransactionHistory(
    existingSnapshot?.transactions ?? [],
    transactions,
  );

  /**
   * Update balances only for accounts represented in the
   * latest file. Balances for accounts absent from this
   * upload remain available from the previous snapshot.
   */
  const latestImportedBalances = findLatestBalancesByAccount(transactions);

  const snapshot: StoredRevolutImportSnapshot = {
    version: 1,
    source: "revolut",
    fileName,
    importedAt: new Date().toISOString(),
    latestBalances: {
      ...(existingSnapshot?.latestBalances ?? {}),
      ...latestImportedBalances,
    },
    lastImportSummary: mergeResult.summary,
    transactions: mergeResult.transactions,
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

    const transactions = ensureUniqueTransactionIds(
      sortTransactions(parsed.transactions),
    );

    return {
      ...parsed,
      lastImportSummary:
        parsed.lastImportSummary ?? getLegacyImportSummary(transactions),
      transactions,
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

export function loadCombinedImportSnapshot(): StoredCombinedImportSnapshot | null {
  const aib = loadAibImportSnapshot();
  const revolut = loadRevolutImportSnapshot();

  const availableSnapshots = [aib, revolut].filter(
    (
      snapshot,
    ): snapshot is StoredAibImportSnapshot | StoredRevolutImportSnapshot =>
      snapshot !== null,
  );

  if (availableSnapshots.length === 0) {
    return null;
  }

  /**
   * Cross-provider identities include their source, so an
   * AIB transfer and its matching Revolut transfer remain
   * separate records. They can be linked semantically in a
   * future internal-transfer feature.
   */
  const combinedMerge = mergeTransactionHistory(
    [],
    availableSnapshots.flatMap((snapshot) => snapshot.transactions),
  );

  return {
    source: "combined-import",
    importedAt: getLatestImportedAt(availableSnapshots),
    sourceFileNames: availableSnapshots.map((snapshot) => snapshot.fileName),
    aib,
    revolut,
    transactions: combinedMerge.transactions,
  };
}
