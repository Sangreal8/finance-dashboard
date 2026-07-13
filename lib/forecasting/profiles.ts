import type {
  EnrichedTransaction,
  MerchantCategory,
} from "@/lib/merchants";
import {
  buildHistoryPeriod,
  getHistoryConfidence,
  getTransactionHistoryPeriod,
} from "./history";
import type {
  CategorySpendingProfile,
  SpendingProfileConfidence,
  SpendingProfileSummary,
} from "./types";

interface CategoryAccumulator {
  category: MerchantCategory;

  transactions: EnrichedTransaction[];

  merchantIds: Set<string>;
  merchantNames: Set<string>;
}

function isEligibleSpendingTransaction(
  transaction: EnrichedTransaction
): boolean {
  if (transaction.amount >= 0) {
    return false;
  }

  if (transaction.ignored) {
    return false;
  }

  if (
    transaction.kind === "transfer" ||
    transaction.kind === "refund" ||
    transaction.kind === "income"
  ) {
    return false;
  }

  if (
    transaction.category ===
    "Uncategorised"
  ) {
    return false;
  }

  return true;
}

function roundCurrency(
  amount: number
): number {
  return Math.round(amount * 100) / 100;
}

function createCategoryProfile(
  accumulator: CategoryAccumulator
): CategorySpendingProfile {
  const transactions =
    accumulator.transactions
      .slice()
      .sort((first, second) =>
        first.postedDate.localeCompare(
          second.postedDate
        )
      );

  const firstSeen =
    transactions[0].postedDate;

  const lastSeen =
    transactions[
      transactions.length - 1
    ].postedDate;

  const history = buildHistoryPeriod(
    firstSeen,
    lastSeen
  );

  const totalSpent =
    transactions.reduce(
      (total, transaction) =>
        total +
        Math.abs(transaction.amount),
      0
    );

  const transactionCount =
    transactions.length;

  const averageTransactionAmount =
    transactionCount === 0
      ? 0
      : totalSpent / transactionCount;

  const averageDailySpend =
    history.daysCovered === 0
      ? 0
      : totalSpent /
        history.daysCovered;

  const averageWeeklySpend =
    averageDailySpend * 7;

  const averageMonthlySpend =
    averageDailySpend * 30.4375;

  return {
    category: accumulator.category,

    transactionCount,
    merchantCount:
      accumulator.merchantIds.size,

    totalSpent:
      roundCurrency(totalSpent),

    averageTransactionAmount:
      roundCurrency(
        averageTransactionAmount
      ),

    averageDailySpend:
      roundCurrency(
        averageDailySpend
      ),

    averageWeeklySpend:
      roundCurrency(
        averageWeeklySpend
      ),

    averageMonthlySpend:
      roundCurrency(
        averageMonthlySpend
      ),

    firstSeen,
    lastSeen,

    history,

    confidence:
      getHistoryConfidence(
        history,
        transactionCount
      ),

    merchantIds: [
      ...accumulator.merchantIds,
    ].sort(),

    merchantNames: [
      ...accumulator.merchantNames,
    ].sort(),
  };
}

function getSummaryConfidence(
  profiles: CategorySpendingProfile[]
): SpendingProfileConfidence {
  if (
    profiles.some(
      (profile) =>
        profile.confidence === "high"
    )
  ) {
    return "high";
  }

  if (
    profiles.some(
      (profile) =>
        profile.confidence === "medium"
    )
  ) {
    return "medium";
  }

  return "low";
}

export function buildCategorySpendingProfiles(
  transactions: EnrichedTransaction[]
): CategorySpendingProfile[] {
  const eligibleTransactions =
    transactions.filter(
      isEligibleSpendingTransaction
    );

  const categories = new Map<
    MerchantCategory,
    CategoryAccumulator
  >();

  eligibleTransactions.forEach(
    (transaction) => {
      const existing =
        categories.get(
          transaction.category
        );

      if (existing) {
        existing.transactions.push(
          transaction
        );

        existing.merchantIds.add(
          transaction.merchantId
        );

        existing.merchantNames.add(
          transaction.merchantName
        );

        return;
      }

      categories.set(
        transaction.category,
        {
          category:
            transaction.category,

          transactions: [
            transaction,
          ],

          merchantIds: new Set([
            transaction.merchantId,
          ]),

          merchantNames: new Set([
            transaction.merchantName,
          ]),
        }
      );
    }
  );

  return [...categories.values()]
    .map(createCategoryProfile)
    .sort(
      (first, second) =>
        second.totalSpent -
        first.totalSpent
    );
}

export function buildSpendingProfileSummary(
  transactions: EnrichedTransaction[]
): SpendingProfileSummary {
  const profiles =
    buildCategorySpendingProfiles(
      transactions
    );

  const eligibleTransactions =
    transactions.filter(
      isEligibleSpendingTransaction
    );

  const history =
    getTransactionHistoryPeriod(
      eligibleTransactions
    );

  return {
    profiles,

    totalCategories:
      profiles.length,

    totalTransactions:
      profiles.reduce(
        (total, profile) =>
          total +
          profile.transactionCount,
        0
      ),

    totalSpent: roundCurrency(
      profiles.reduce(
        (total, profile) =>
          total + profile.totalSpent,
        0
      )
    ),

    historyStartDate:
      history?.startDate,

    historyEndDate:
      history?.endDate,

    daysCovered:
      history?.daysCovered ?? 0,

    confidence:
      getSummaryConfidence(profiles),
  };
}