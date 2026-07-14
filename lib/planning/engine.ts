import { accounts } from "@/data/accounts";
import { monthlyPlan } from "@/data/monthlyPlan";
import { reserves } from "@/data/reserves";
import {
  buildCategoryForecasts,
  buildSpendingProfileSummary,
  categoryForecastsToPlanItems,
} from "@/lib/forecasting";
import { buildFinanceTimeline } from "@/lib/finance/planner";
import { buildFinancialPosition } from "@/lib/finance/position";
import type {
  Account,
  MonthlyPlan,
  PlannedCommitment,
} from "@/lib/finance/types";
import { loadCombinedImportSnapshot } from "@/lib/import";
import type { StoredCombinedImportSnapshot } from "@/lib/import";
import {
  applyDefinitionsToTransactions,
  buildMerchantLibrary,
  loadMerchantDefinitions,
} from "@/lib/merchants";
import type { EnrichedTransaction, MerchantProfile } from "@/lib/merchants";
import {
  buildReconciliationSummary,
  reconcileCommitments,
} from "@/lib/reconciliation";
import type {
  ReconciliationMatch,
  ReconciliationSummary,
} from "@/lib/reconciliation";
import type { PlanningDataFreshness, PlanningSnapshot } from "./types";

function formatLocalDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getMonthStart(referenceDate: Date): string {
  return formatLocalDate(
    new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
  );
}

function getMonthEnd(referenceDate: Date): string {
  return formatLocalDate(
    new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0),
  );
}

function updateImportedBalances(
  currentAccounts: Account[],
  importedSnapshot: StoredCombinedImportSnapshot,
): Account[] {
  const latestAibBalance = importedSnapshot.aib?.latestBalance;

  const latestRevolutCurrentBalance =
    importedSnapshot.revolut?.latestBalances["revolut-current"];

  return currentAccounts.map((account) => {
    if (account.id === "aib-current" && latestAibBalance !== undefined) {
      return {
        ...account,
        balance: latestAibBalance,
      };
    }

    if (
      account.id === "revolut-current" &&
      latestRevolutCurrentBalance !== undefined
    ) {
      return {
        ...account,
        balance: latestRevolutCurrentBalance,
      };
    }

    /**
     * The Revolut export exposes Savings as one aggregate product.
     * It cannot reliably split that balance between the Solicitors
     * and Sweepstake pockets, so those manually maintained balances
     * deliberately remain untouched.
     */
    return account;
  });
}

function applyReconciliationMatch(
  commitment: PlannedCommitment,
  match: ReconciliationMatch | undefined,
): PlannedCommitment {
  if (!match) {
    return commitment;
  }

  if (match.status === "paid") {
    return {
      ...commitment,
      status: "paid",
      matchedTransactionId: match.transaction?.id,
    };
  }

  if (match.status === "overdue") {
    return {
      ...commitment,
      status: "missed",
      matchedTransactionId: undefined,
    };
  }

  if (match.status === "cancelled") {
    return {
      ...commitment,
      status: "cancelled",
      matchedTransactionId: undefined,
    };
  }

  return {
    ...commitment,
    status: "planned",
    matchedTransactionId: undefined,
  };
}

function buildReconciledPlan(
  basePlan: MonthlyPlan,
  matches: ReconciliationMatch[],
): MonthlyPlan {
  const matchesByCommitmentId = new Map(
    matches.map((match) => [match.commitment.id, match]),
  );

  return {
    ...basePlan,

    /**
     * Manual forecast items deliberately remain active.
     * Calculated forecasts are exposed separately until
     * they are sufficiently reliable.
     */
    forecastItems: basePlan.forecastItems,

    commitments: basePlan.commitments.map((commitment) =>
      applyReconciliationMatch(
        commitment,
        matchesByCommitmentId.get(commitment.id),
      ),
    ),
  };
}

function getLatestTransactionDate(
  importedSnapshot: StoredCombinedImportSnapshot,
): string | undefined {
  if (importedSnapshot.transactions.length === 0) {
    return undefined;
  }

  return importedSnapshot.transactions.reduce(
    (latestDate, transaction) =>
      transaction.postedDate > latestDate ? transaction.postedDate : latestDate,
    importedSnapshot.transactions[0].postedDate,
  );
}

function getLatestBalanceDate(
  importedSnapshot: StoredCombinedImportSnapshot,
): string | undefined {
  const transactionsWithBalances = importedSnapshot.transactions.filter(
    (transaction) => typeof transaction.balanceAfter === "number",
  );

  if (transactionsWithBalances.length === 0) {
    return undefined;
  }

  return transactionsWithBalances.reduce(
    (latestDate, transaction) =>
      transaction.postedDate > latestDate ? transaction.postedDate : latestDate,
    transactionsWithBalances[0].postedDate,
  );
}

function buildImportedFreshness(
  importedSnapshot: StoredCombinedImportSnapshot,
): PlanningDataFreshness {
  return {
    source: "combined-import",
    importedAt: importedSnapshot.importedAt,
    sourceFileNames: importedSnapshot.sourceFileNames,
    latestTransactionDate: getLatestTransactionDate(importedSnapshot),
    latestBalanceDate: getLatestBalanceDate(importedSnapshot),
    includesAib: importedSnapshot.aib !== null,
    includesRevolut: importedSnapshot.revolut !== null,
  };
}

function buildManualPlanningSnapshot(referenceDate: Date): PlanningSnapshot {
  const referenceDateString = formatLocalDate(referenceDate);

  return {
    generatedAt: new Date().toISOString(),
    referenceDate: referenceDateString,

    dataFreshness: {
      source: "manual",
    },

    accounts,
    plan: monthlyPlan,
    reserves,

    position: buildFinancialPosition(accounts, monthlyPlan, reserves),

    timeline: buildFinanceTimeline(accounts, monthlyPlan),

    importedSnapshot: null,

    transactions: [],
    merchantProfiles: [],

    spendingProfiles: null,

    forecasts: {
      active: monthlyPlan.forecastItems,
      calculated: [],
      eligible: [],
      mode: "manual",
    },

    reconciliation: null,
  };
}

interface ImportedKnowledge {
  merchantProfiles: MerchantProfile[];
  transactions: EnrichedTransaction[];
}

function buildImportedKnowledge(
  importedSnapshot: StoredCombinedImportSnapshot,
): ImportedKnowledge {
  const definitions = loadMerchantDefinitions();

  const merchantProfiles = buildMerchantLibrary(
    importedSnapshot.transactions,
    definitions,
  );

  const transactions = applyDefinitionsToTransactions(
    importedSnapshot.transactions,
    definitions,
    merchantProfiles,
  );

  return {
    merchantProfiles,
    transactions,
  };
}

function buildImportedPlanningSnapshot(
  importedSnapshot: StoredCombinedImportSnapshot,
  referenceDate: Date,
): PlanningSnapshot {
  const referenceDateString = formatLocalDate(referenceDate);

  const liveAccounts = updateImportedBalances(accounts, importedSnapshot);

  const reconciliationMatches = reconcileCommitments(
    monthlyPlan.commitments,
    importedSnapshot.transactions,
    {
      referenceDate: referenceDateString,
    },
  );

  const reconciliation: ReconciliationSummary = buildReconciliationSummary(
    reconciliationMatches,
  );

  const livePlan = buildReconciledPlan(monthlyPlan, reconciliationMatches);

  const { merchantProfiles, transactions } =
    buildImportedKnowledge(importedSnapshot);

  const spendingProfiles = buildSpendingProfileSummary(transactions);

  const calculatedForecasts = buildCategoryForecasts({
    profiles: spendingProfiles.profiles,
    transactions,
    periodStartDate: getMonthStart(referenceDate),
    periodEndDate: getMonthEnd(referenceDate),
  });

  const eligibleForecasts = categoryForecastsToPlanItems(
    calculatedForecasts,
    "medium",
  );

  return {
    generatedAt: new Date().toISOString(),
    referenceDate: referenceDateString,

    dataFreshness: buildImportedFreshness(importedSnapshot),

    accounts: liveAccounts,
    plan: livePlan,
    reserves,

    position: buildFinancialPosition(liveAccounts, livePlan, reserves),

    timeline: buildFinanceTimeline(liveAccounts, livePlan),

    importedSnapshot,

    transactions,
    merchantProfiles,
    spendingProfiles,

    forecasts: {
      active: livePlan.forecastItems,
      calculated: calculatedForecasts,
      eligible: eligibleForecasts,
      mode: "manual",
    },

    reconciliation,
  };
}

/**
 * Builds the complete planning state from the
 * best locally available import data.
 *
 * This function reads browser storage and must
 * therefore be called from client-side code.
 */
export function buildStoredPlanningSnapshot(
  referenceDate = new Date(),
): PlanningSnapshot {
  const importedSnapshot = loadCombinedImportSnapshot();

  if (!importedSnapshot) {
    return buildManualPlanningSnapshot(referenceDate);
  }

  return buildImportedPlanningSnapshot(importedSnapshot, referenceDate);
}
