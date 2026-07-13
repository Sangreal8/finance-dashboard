import type {
  EnrichedTransaction,
} from "@/lib/merchants";
import type {
  SpendingHistoryPeriod,
  SpendingProfileConfidence,
} from "./types";

const MILLISECONDS_PER_DAY =
  1000 * 60 * 60 * 24;

function parseDate(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

export function differenceInCalendarDays(
  startDate: string,
  endDate: string
): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  return Math.max(
    0,
    Math.round(
      (end.getTime() - start.getTime()) /
        MILLISECONDS_PER_DAY
    )
  );
}

export function buildHistoryPeriod(
  startDate: string,
  endDate: string
): SpendingHistoryPeriod {
  /**
   * Include both the first and final dates in the
   * observed period.
   */
  const daysCovered =
    differenceInCalendarDays(
      startDate,
      endDate
    ) + 1;

  return {
    startDate,
    endDate,
    daysCovered,
    weeksCovered: daysCovered / 7,
    monthsCovered: daysCovered / 30.4375,
  };
}

export function getTransactionHistoryPeriod(
  transactions: EnrichedTransaction[]
): SpendingHistoryPeriod | null {
  if (transactions.length === 0) {
    return null;
  }

  const dates = transactions
    .map(
      (transaction) =>
        transaction.postedDate
    )
    .sort();

  return buildHistoryPeriod(
    dates[0],
    dates[dates.length - 1]
  );
}

export function getHistoryConfidence(
  history: SpendingHistoryPeriod,
  transactionCount: number
): SpendingProfileConfidence {
  if (
    history.daysCovered >= 120 &&
    transactionCount >= 12
  ) {
    return "high";
  }

  if (
    history.daysCovered >= 45 &&
    transactionCount >= 5
  ) {
    return "medium";
  }

  return "low";
}