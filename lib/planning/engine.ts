import { accounts } from "@/data/accounts";
import { monthlyPlan } from "@/data/monthlyPlan";
import { reserves } from "@/data/reserves";
import {
  buildCategoryForecasts,
  buildSpendingProfileSummary,
  categoryForecastsToPlanItems,
} from "@/lib/forecasting";
import {
  buildFinanceTimeline,
} from "@/lib/finance/planner";
import {
  buildFinancialPosition,
} from "@/lib/finance/position";
import type {
  Account,
  MonthlyPlan,
  PlannedCommitment,
} from "@/lib/finance/types";
import {
  loadAibImportSnapshot,
} from "@/lib/import";
import type {
  StoredAibImportSnapshot,
} from "@/lib/import";
import {
  applyDefinitionsToTransactions,
  buildMerchantLibrary,
  loadMerchantDefinitions,
} from "@/lib/merchants";
import type {
  EnrichedTransaction,
  MerchantProfile,
} from "@/lib/merchants";
import {
  buildReconciliationSummary,
  reconcileCommitments,
} from "@/lib/reconciliation";
import type {
  ReconciliationMatch,
  ReconciliationSummary,
} from "@/lib/reconciliation";
import type {
  PlanningDataFreshness,
  PlanningSnapshot,
} from "./types";

function formatLocalDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(
      2,
      "0"
    ),
    String(date.getDate()).padStart(
      2,
      "0"
    ),
  ].join("-");
}

function getMonthStart(
  referenceDate: Date
): string {
  return formatLocalDate(
    new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      1
    )
  );
}

function getMonthEnd(
  referenceDate: Date
): string {
  return formatLocalDate(
    new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      0
    )
  );
}

function updateAibBalance(
  currentAccounts: Account[],
  latestBalance?: number
): Account[] {
  if (latestBalance === undefined) {
    return currentAccounts;
  }

  return currentAccounts.map((account) =>
    account.id === "aib-current"
      ? {
          ...account,
          balance: latestBalance,
        }
      : account
  );
}

function applyReconciliationMatch(
  commitment: PlannedCommitment,
  match: ReconciliationMatch | undefined
): PlannedCommitment {
  if (!match) {
    return commitment;
  }

  if (match.status === "paid") {
    return {
      ...commitment,
      status: "paid",
      matchedTransactionId:
        match.transaction?.id,
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
  matches: ReconciliationMatch[]
): MonthlyPlan {
  const matchesByCommitmentId = new Map(
    matches.map((match) => [
      match.commitment.id,
      match,
    ])
  );

  return {
    ...basePlan,

    /**
     * Manual forecast items deliberately remain active.
     * Calculated forecasts are exposed separately in the
     * PlanningSnapshot until they are sufficiently reliable.
     */
    forecastItems: basePlan.forecastItems,

    commitments: basePlan.commitments.map(
      (commitment) =>
        applyReconciliationMatch(
          commitment,
          matchesByCommitmentId.get(
            commitment.id
          )
        )
    ),
  };
}

function getLatestTransactionDate(
  importedSnapshot: StoredAibImportSnapshot
): string | undefined {
  if (
    importedSnapshot.transactions.length ===
    0
  ) {
    return undefined;
  }

  return importedSnapshot.transactions.reduce(
    (latestDate, transaction) =>
      transaction.postedDate > latestDate
        ? transaction.postedDate
        : latestDate,
    importedSnapshot.transactions[0]
      .postedDate
  );
}

function getLatestBalanceDate(
  importedSnapshot: StoredAibImportSnapshot
): string | undefined {
  const transactionsWithBalances =
    importedSnapshot.transactions.filter(
      (transaction) =>
        typeof transaction.balanceAfter ===
        "number"
    );

  if (
    transactionsWithBalances.length === 0
  ) {
    return undefined;
  }

  return transactionsWithBalances.reduce(
    (latestDate, transaction) =>
      transaction.postedDate > latestDate
        ? transaction.postedDate
        : latestDate,
    transactionsWithBalances[0].postedDate
  );
}

function buildImportedFreshness(
  importedSnapshot: StoredAibImportSnapshot
): PlanningDataFreshness {
  return {
    source: "aib-import",
    importedAt:
      importedSnapshot.importedAt,
    sourceFileName:
      importedSnapshot.fileName,
    latestTransactionDate:
      getLatestTransactionDate(
        importedSnapshot
      ),
    latestBalanceDate:
      getLatestBalanceDate(
        importedSnapshot
      ),
  };
}

function buildManualPlanningSnapshot(
  referenceDate: Date
): PlanningSnapshot {
  const referenceDateString =
    formatLocalDate(referenceDate);

  return {
    generatedAt: new Date().toISOString(),
    referenceDate: referenceDateString,

    dataFreshness: {
      source: "manual",
    },

    accounts,
    plan: monthlyPlan,
    reserves,

    position: buildFinancialPosition(
      accounts,
      monthlyPlan,
      reserves
    ),

    timeline: buildFinanceTimeline(
      accounts,
      monthlyPlan
    ),

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
  importedSnapshot: StoredAibImportSnapshot
): ImportedKnowledge {
  const definitions =
    loadMerchantDefinitions();

  const merchantProfiles =
    buildMerchantLibrary(
      importedSnapshot.transactions,
      definitions
    );

  const transactions =
    applyDefinitionsToTransactions(
      importedSnapshot.transactions,
      definitions,
      merchantProfiles
    );

  return {
    merchantProfiles,
    transactions,
  };
}

function buildImportedPlanningSnapshot(
  importedSnapshot: StoredAibImportSnapshot,
  referenceDate: Date
): PlanningSnapshot {
  const referenceDateString =
    formatLocalDate(referenceDate);

  const liveAccounts = updateAibBalance(
    accounts,
    importedSnapshot.latestBalance
  );

  const reconciliationMatches =
    reconcileCommitments(
      monthlyPlan.commitments,
      importedSnapshot.transactions,
      {
        referenceDate:
          referenceDateString,
      }
    );

  const reconciliation:
    ReconciliationSummary =
      buildReconciliationSummary(
        reconciliationMatches
      );

  const livePlan = buildReconciledPlan(
    monthlyPlan,
    reconciliationMatches
  );

  const {
    merchantProfiles,
    transactions,
  } = buildImportedKnowledge(
    importedSnapshot
  );

  const spendingProfiles =
    buildSpendingProfileSummary(
      transactions
    );

  const calculatedForecasts =
    buildCategoryForecasts({
      profiles:
        spendingProfiles.profiles,
      transactions,
      periodStartDate:
        getMonthStart(referenceDate),
      periodEndDate:
        getMonthEnd(referenceDate),
    });

  /**
   * Only medium- or high-confidence calculated
   * forecasts are considered eligible.
   *
   * They are not yet applied to the active plan.
   */
  const eligibleForecasts =
    categoryForecastsToPlanItems(
      calculatedForecasts,
      "medium"
    );

  return {
    generatedAt: new Date().toISOString(),
    referenceDate:
      referenceDateString,

    dataFreshness:
      buildImportedFreshness(
        importedSnapshot
      ),

    accounts: liveAccounts,
    plan: livePlan,
    reserves,

    position: buildFinancialPosition(
      liveAccounts,
      livePlan,
      reserves
    ),

    timeline: buildFinanceTimeline(
      liveAccounts,
      livePlan
    ),

    importedSnapshot,

    transactions,
    merchantProfiles,
    spendingProfiles,

    forecasts: {
      active: livePlan.forecastItems,
      calculated:
        calculatedForecasts,
      eligible:
        eligibleForecasts,
      mode: "manual",
    },

    reconciliation,
  };
}

/**
 * Builds the complete planning state from the
 * best locally available source.
 *
 * This function reads browser storage and must
 * therefore be called from client-side code.
 */
export function buildStoredPlanningSnapshot(
  referenceDate = new Date()
): PlanningSnapshot {
  const importedSnapshot =
    loadAibImportSnapshot();

  if (!importedSnapshot) {
    return buildManualPlanningSnapshot(
      referenceDate
    );
  }

  return buildImportedPlanningSnapshot(
    importedSnapshot,
    referenceDate
  );
}