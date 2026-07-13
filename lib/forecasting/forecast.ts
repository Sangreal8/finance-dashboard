import type {
  CommitmentType,
  ForecastItem,
} from "@/lib/finance/types";
import type {
  EnrichedTransaction,
  MerchantCategory,
} from "@/lib/merchants";
import type {
  CategorySpendingProfile,
  SpendingProfileConfidence,
} from "./types";

export interface CategoryForecast {
  id: string;
  category: MerchantCategory;
  name: string;

  expectedTotal: number;
  spentInPeriod: number;
  remainingAmount: number;

  type: CommitmentType;
  confidence: SpendingProfileConfidence;

  source: "history";
  historyDays: number;
  transactionCount: number;
}

export interface BuildCategoryForecastsArgs {
  profiles: CategorySpendingProfile[];
  transactions: EnrichedTransaction[];

  /**
   * Final date of the planning period.
   * For now this can be payday or month-end.
   */
  periodStartDate: string;
  periodEndDate: string;

  /**
   * Categories that should influence forecast spending.
   */
  includedCategories?: MerchantCategory[];

  /**
   * Profiles below this confidence are still returned for inspection,
   * but can be excluded when converting them into finance ForecastItems.
   */
  minimumConfidence?: SpendingProfileConfidence;
}

const DEFAULT_FORECAST_CATEGORIES:
  MerchantCategory[] = [
    "Groceries",
    "Fuel",
    "Eating out",
    "Shopping",
    "Other",
  ];

const confidenceRank: Record<
  SpendingProfileConfidence,
  number
> = {
  low: 1,
  medium: 2,
  high: 3,
};

const categoryTypeMap: Partial<
  Record<MerchantCategory, CommitmentType>
> = {
  Groceries: "essential",
  Fuel: "essential",
  Bills: "essential",
  "Eating out": "discretionary",
  Shopping: "discretionary",
  Other: "discretionary",
};

function parseDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function differenceInCalendarDays(
  startDate: string,
  endDate: string
) {
  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return Math.max(
    0,
    Math.round(
      (parseDate(endDate).getTime() -
        parseDate(startDate).getTime()) /
        millisecondsPerDay
    )
  );
}

function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100;
}

function createForecastId(
  category: MerchantCategory
) {
  return `forecast-${category
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function isWithinPeriod(
  date: string,
  startDate: string,
  endDate: string
) {
  return (
    date >= startDate &&
    date <= endDate
  );
}

function getSpentInPeriod(
  category: MerchantCategory,
  transactions: EnrichedTransaction[],
  startDate: string,
  endDate: string
) {
  return transactions
    .filter((transaction) => {
      if (transaction.amount >= 0) {
        return false;
      }

      if (
        transaction.ignored ||
        !transaction.includeInForecast
      ) {
        return false;
      }

      if (
        transaction.category !== category
      ) {
        return false;
      }

      return isWithinPeriod(
        transaction.postedDate,
        startDate,
        endDate
      );
    })
    .reduce(
      (total, transaction) =>
        total +
        Math.abs(transaction.amount),
      0
    );
}

function getExpectedPeriodSpend(
  profile: CategorySpendingProfile,
  periodStartDate: string,
  periodEndDate: string
) {
  const periodDays =
    differenceInCalendarDays(
      periodStartDate,
      periodEndDate
    ) + 1;

  return (
    profile.averageDailySpend *
    periodDays
  );
}

export function buildCategoryForecasts({
  profiles,
  transactions,
  periodStartDate,
  periodEndDate,
  includedCategories =
    DEFAULT_FORECAST_CATEGORIES,
}: BuildCategoryForecastsArgs): CategoryForecast[] {
  return profiles
    .filter((profile) =>
      includedCategories.includes(
        profile.category
      )
    )
    .map((profile) => {
      const expectedTotal =
        getExpectedPeriodSpend(
          profile,
          periodStartDate,
          periodEndDate
        );

      const spentInPeriod =
        getSpentInPeriod(
          profile.category,
          transactions,
          periodStartDate,
          periodEndDate
        );

      const remainingAmount = Math.max(
        0,
        expectedTotal - spentInPeriod
      );

      return {
        id: createForecastId(
          profile.category
        ),

        category: profile.category,
        name: profile.category,

        expectedTotal:
          roundCurrency(expectedTotal),

        spentInPeriod:
          roundCurrency(spentInPeriod),

        remainingAmount:
          roundCurrency(remainingAmount),

        type:
          categoryTypeMap[
            profile.category
          ] ?? "discretionary",

        confidence: profile.confidence,

        source: "history" as const,
        historyDays:
          profile.history.daysCovered,

        transactionCount:
          profile.transactionCount,
      };
    })
    .sort(
      (first, second) =>
        second.remainingAmount -
        first.remainingAmount
    );
}

export function categoryForecastsToPlanItems(
  forecasts: CategoryForecast[],
  minimumConfidence:
    SpendingProfileConfidence = "medium"
): ForecastItem[] {
  const minimumRank =
    confidenceRank[minimumConfidence];

  return forecasts
    .filter(
      (forecast) =>
        confidenceRank[
          forecast.confidence
        ] >= minimumRank
    )
    .filter(
      (forecast) =>
        forecast.remainingAmount > 0
    )
    .map((forecast) => ({
      id: forecast.id,
      name: forecast.name,
      amount: forecast.remainingAmount,
      type: forecast.type,
      confidence: "estimated",
    }));
}