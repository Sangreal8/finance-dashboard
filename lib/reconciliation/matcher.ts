import type {
  PlannedCommitment,
} from "@/lib/finance/types";
import type {
  NormalisedTransaction,
} from "@/lib/import";
import type {
  MatchConfidence,
  ReconciliationMatch,
  ReconciliationOptions,
  ReconciliationStatus,
} from "./types";

const DEFAULT_HIGH_CONFIDENCE_WINDOW_DAYS = 5;
const DEFAULT_MAXIMUM_WINDOW_DAYS = 10;
const DEFAULT_FIXED_AMOUNT_TOLERANCE = 0.01;
const DEFAULT_ESTIMATED_TOLERANCE_PERCENT = 0.15;

interface MatchCandidate {
  transaction: NormalisedTransaction;
  confidence: Exclude<MatchConfidence, "none">;
  amountDifference: number;
  dateDifferenceDays: number;
  score: number;
}

function parseDate(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

function differenceInDays(
  firstDate: string,
  secondDate: string
): number {
  const first = parseDate(firstDate);
  const second = parseDate(secondDate);

  return Math.abs(
    Math.round(
      (first.getTime() - second.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function isBefore(
  firstDate: string,
  secondDate: string
): boolean {
  return (
    parseDate(firstDate).getTime() <
    parseDate(secondDate).getTime()
  );
}

function normaliseForMatching(
  value: string
): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function merchantMatches(
  commitment: PlannedCommitment,
  transaction: NormalisedTransaction
): boolean {
  const patterns =
    commitment.merchantPatterns?.length
      ? commitment.merchantPatterns
      : [commitment.name];

  const descriptions = [
    transaction.merchantName,
    transaction.normalisedDescription,
    transaction.rawDescription,
  ].map(normaliseForMatching);

  return patterns.some((pattern) => {
    const normalisedPattern =
      normaliseForMatching(pattern);

    return descriptions.some((description) =>
      description.includes(normalisedPattern)
    );
  });
}

function getAmountDifference(
  commitment: PlannedCommitment,
  transaction: NormalisedTransaction
): number {
  return Math.abs(
    Math.abs(transaction.amount) -
      commitment.amount
  );
}

function amountMatches(
  commitment: PlannedCommitment,
  transaction: NormalisedTransaction,
  options: Required<
    Pick<
      ReconciliationOptions,
      | "fixedAmountTolerance"
      | "estimatedAmountTolerancePercent"
    >
  >
): boolean {
  const difference = getAmountDifference(
    commitment,
    transaction
  );

  if (commitment.confidence === "confirmed") {
    return (
      difference <= options.fixedAmountTolerance
    );
  }

  const allowedDifference = Math.max(
    options.fixedAmountTolerance,
    commitment.amount *
      options.estimatedAmountTolerancePercent
  );

  return difference <= allowedDifference;
}

function isEligibleTransaction(
  transaction: NormalisedTransaction
): boolean {
  if (transaction.amount >= 0) {
    return false;
  }

  return (
    transaction.kind === "purchase" ||
    transaction.kind === "fee" ||
    transaction.kind === "unknown"
  );
}

function getCandidate(
  commitment: PlannedCommitment,
  transaction: NormalisedTransaction,
  options: Required<
    Pick<
      ReconciliationOptions,
      | "highConfidenceDateWindowDays"
      | "maximumDateWindowDays"
      | "fixedAmountTolerance"
      | "estimatedAmountTolerancePercent"
    >
  >
): MatchCandidate | null {
  if (!isEligibleTransaction(transaction)) {
    return null;
  }

  if (!merchantMatches(commitment, transaction)) {
    return null;
  }

  if (
    !amountMatches(
      commitment,
      transaction,
      options
    )
  ) {
    return null;
  }

  const dateDifferenceDays = differenceInDays(
    commitment.dueDate,
    transaction.postedDate
  );

  if (
    dateDifferenceDays >
    options.maximumDateWindowDays
  ) {
    return null;
  }

  const amountDifference =
    getAmountDifference(
      commitment,
      transaction
    );

  const confidence: MatchCandidate["confidence"] =
    dateDifferenceDays <=
      options.highConfidenceDateWindowDays &&
    amountDifference <=
      options.fixedAmountTolerance
      ? "high"
      : "medium";

  const score =
    dateDifferenceDays * 100 +
    amountDifference;

  return {
    transaction,
    confidence,
    amountDifference,
    dateDifferenceDays,
    score,
  };
}

function getUnmatchedStatus(
  commitment: PlannedCommitment,
  referenceDate: string
): ReconciliationStatus {
  if (commitment.status === "cancelled") {
    return "cancelled";
  }

  if (
    commitment.status === "paid" ||
    commitment.status === "matched"
  ) {
    return "paid";
  }

  if (
    isBefore(
      commitment.dueDate,
      referenceDate
    )
  ) {
    return "overdue";
  }

  return "upcoming";
}

export function reconcileCommitments(
  commitments: PlannedCommitment[],
  transactions: NormalisedTransaction[],
  options: ReconciliationOptions
): ReconciliationMatch[] {
  const resolvedOptions = {
    highConfidenceDateWindowDays:
      options.highConfidenceDateWindowDays ??
      DEFAULT_HIGH_CONFIDENCE_WINDOW_DAYS,

    maximumDateWindowDays:
      options.maximumDateWindowDays ??
      DEFAULT_MAXIMUM_WINDOW_DAYS,

    fixedAmountTolerance:
      options.fixedAmountTolerance ??
      DEFAULT_FIXED_AMOUNT_TOLERANCE,

    estimatedAmountTolerancePercent:
      options.estimatedAmountTolerancePercent ??
      DEFAULT_ESTIMATED_TOLERANCE_PERCENT,
  };

  const usedTransactionIds =
    new Set<string>();

  return commitments.map((commitment) => {
    if (
      commitment.status === "cancelled"
    ) {
      return {
        commitment,
        status: "cancelled",
        confidence: "none",
      };
    }

    const candidates = transactions
      .filter(
        (transaction) =>
          !usedTransactionIds.has(
            transaction.id
          )
      )
      .map((transaction) =>
        getCandidate(
          commitment,
          transaction,
          resolvedOptions
        )
      )
      .filter(
        (
          candidate
        ): candidate is MatchCandidate =>
          candidate !== null
      )
      .sort(
        (first, second) =>
          first.score - second.score
      );

    const bestCandidate = candidates[0];

    if (!bestCandidate) {
      return {
        commitment,
        status: getUnmatchedStatus(
          commitment,
          options.referenceDate
        ),
        confidence: "none",
      };
    }

    usedTransactionIds.add(
      bestCandidate.transaction.id
    );

    return {
      commitment,
      transaction:
        bestCandidate.transaction,
      status: "paid",
      confidence:
        bestCandidate.confidence,
      amountDifference:
        bestCandidate.amountDifference,
      dateDifferenceDays:
        bestCandidate.dateDifferenceDays,
    };
  });
}