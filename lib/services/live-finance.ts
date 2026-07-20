import { accounts } from "@/data/accounts";
import { monthlyPlan } from "@/data/monthlyPlan";
import { reserves } from "@/data/reserves";
import { buildFinanceTimeline } from "@/lib/finance/planner";
import { buildFinancialPosition } from "@/lib/finance/position";
import type {
  Account,
  MonthlyPlan,
  PlannedCommitment,
} from "@/lib/finance/types";
import type { StoredAibImportSnapshot } from "@/lib/import/storage";
import { reconcileCommitments } from "@/lib/reconciliation";
import type { ReconciliationMatch } from "@/lib/reconciliation";

export interface LiveFinanceSnapshot {
  accounts: Account[];
  plan: MonthlyPlan;
  position: ReturnType<typeof buildFinancialPosition>;
  timeline: ReturnType<typeof buildFinanceTimeline>;
  importedAt: string;
  sourceFileName: string;
}

function updateAibBalance(
  currentAccounts: Account[],
  latestBalance?: number,
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
      : account,
  );
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
    };
  }

  if (match.status === "cancelled") {
    return {
      ...commitment,
      status: "cancelled",
    };
  }

  return {
    ...commitment,
    status: "planned",
  };
}

function buildReconciledPlan(
  importedSnapshot: StoredAibImportSnapshot,
  referenceDate: string,
): MonthlyPlan {
  const matches = reconcileCommitments(
    monthlyPlan.commitments,
    importedSnapshot.transactions,
    {
      referenceDate,
    },
  );

  const matchesByCommitmentId = new Map(
    matches.map((match) => [match.commitment.id, match]),
  );

  return {
    ...monthlyPlan,
    commitments: monthlyPlan.commitments.map((commitment) =>
      applyReconciliationMatch(
        commitment,
        matchesByCommitmentId.get(commitment.id),
      ),
    ),
  };
}

export function buildLiveFinanceSnapshot(
  importedSnapshot: StoredAibImportSnapshot,
  referenceDate: string,
): LiveFinanceSnapshot {
  const liveAccounts = updateAibBalance(
    accounts,
    importedSnapshot.latestBalance,
  );

  const livePlan = buildReconciledPlan(importedSnapshot, referenceDate);

  return {
    accounts: liveAccounts,
    plan: livePlan,
    position: buildFinancialPosition(liveAccounts, livePlan, reserves),
    timeline: buildFinanceTimeline(liveAccounts, livePlan, referenceDate),
    importedAt: importedSnapshot.importedAt,
    sourceFileName: importedSnapshot.fileName,
  };
}
