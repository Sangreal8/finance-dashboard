import type {
  PlannedCommitment,
  PlannedCommitmentStatus,
} from "@/lib/finance/types";
import type {
  NormalisedTransaction,
} from "@/lib/import";

export type ReconciliationStatus =
  | "paid"
  | "upcoming"
  | "overdue"
  | "cancelled";

export type MatchConfidence =
  | "high"
  | "medium"
  | "none";

export interface ReconciliationMatch {
  commitment: PlannedCommitment;
  transaction?: NormalisedTransaction;

  status: ReconciliationStatus;
  confidence: MatchConfidence;

  amountDifference?: number;
  dateDifferenceDays?: number;
}

export interface ReconciliationSummary {
  total: number;
  paid: number;
  upcoming: number;
  overdue: number;
  cancelled: number;

  paidAmount: number;
  remainingAmount: number;
  overdueAmount: number;

  matches: ReconciliationMatch[];
}

export interface ReconciliationOptions {
  referenceDate: string;
  highConfidenceDateWindowDays?: number;
  maximumDateWindowDays?: number;
  fixedAmountTolerance?: number;
  estimatedAmountTolerancePercent?: number;
}

export function mapReconciliationStatusToCommitmentStatus(
  status: ReconciliationStatus
): PlannedCommitmentStatus {
  const statusMap: Record<
    ReconciliationStatus,
    PlannedCommitmentStatus
  > = {
    paid: "paid",
    upcoming: "planned",
    overdue: "missed",
    cancelled: "cancelled",
  };

  return statusMap[status];
}