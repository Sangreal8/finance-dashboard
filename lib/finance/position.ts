import { buildAllocations, getAllocatedCash } from "./allocations";
import { getFinancialStatus } from "./status";
import type {
  Account,
  FinancialBreakdownRow,
  FinancialPosition,
  ForecastSummary,
  IncomeItem,
  MonthlyPlan,
  Reserve,
  SafeToSpendBreakdown,
} from "./types";

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

export function getAvailableCash(accounts: Account[]): number {
  return accounts
    .filter(
      (account) =>
        account.includeInAvailableCash &&
        account.currency === "EUR" &&
        account.type !== "credit_card",
    )
    .reduce((total, account) => total + account.balance, 0);
}

function formatLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function adjustPaydayForWeekend(payday: Date): Date {
  const adjustedPayday = formatLocalDate(payday);

  if (adjustedPayday.getDay() === 6) {
    adjustedPayday.setDate(adjustedPayday.getDate() - 1);
  }

  if (adjustedPayday.getDay() === 0) {
    adjustedPayday.setDate(adjustedPayday.getDate() - 2);
  }

  return adjustedPayday;
}

function getPrimaryIncome(income: IncomeItem[]): IncomeItem | undefined {
  return income
    .slice()
    .sort((first, second) => second.amount - first.amount)[0];
}

function getNextPayday(plan: MonthlyPlan, referenceDate: Date): Date | null {
  const primaryIncome = getPrimaryIncome(plan.income);

  if (!primaryIncome) {
    return null;
  }

  const [planYear, planMonth] = plan.month.split("-").map(Number);

  let payday = adjustPaydayForWeekend(
    new Date(planYear, planMonth - 1, primaryIncome.expectedDay, 12),
  );

  const currentDate = formatLocalDate(referenceDate);

  if (payday.getTime() < currentDate.getTime()) {
    payday = adjustPaydayForWeekend(
      new Date(
        payday.getFullYear(),
        payday.getMonth() + 1,
        primaryIncome.expectedDay,
        12,
      ),
    );
  }

  return payday;
}

function getDaysUntilPayday(plan: MonthlyPlan, referenceDate: Date): number {
  const payday = getNextPayday(plan, referenceDate);

  if (!payday) {
    return 0;
  }

  const currentDate = formatLocalDate(referenceDate);

  return Math.max(
    0,
    Math.round(
      (payday.getTime() - currentDate.getTime()) / MILLISECONDS_PER_DAY,
    ),
  );
}

function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100;
}

function buildSafeToSpendBreakdown({
  availableCash,
  remainingCommitments,
  reservedMoney,
  safetyBuffer,
}: {
  availableCash: number;
  remainingCommitments: number;
  reservedMoney: number;
  safetyBuffer: number;
}): SafeToSpendBreakdown {
  const safeToSpend = Math.max(
    0,
    availableCash - remainingCommitments - reservedMoney - safetyBuffer,
  );

  return {
    availableCash,
    remainingCommitments,
    reservedMoney,
    safetyBuffer,
    safeToSpend,
  };
}

function buildForecastSummary({
  currentCash,
  expectedIncome,
  remainingCommitments,
  expectedRemainingSpend,
  reservedMoney,
}: {
  currentCash: number;
  expectedIncome: number;
  remainingCommitments: number;
  expectedRemainingSpend: number;
  reservedMoney: number;
}): ForecastSummary {
  const projectedMonthEndBalance =
    currentCash +
    expectedIncome -
    remainingCommitments -
    expectedRemainingSpend -
    reservedMoney;

  return {
    currentCash,
    expectedIncome,
    remainingCommitments,
    expectedRemainingSpend,
    reservedMoney,
    projectedMonthEndBalance,
    confidence: "medium",
    confidenceScore: 0.5,
    explanation: [
      "The forecast uses planned commitments, expected income and estimated remaining spending.",
      "Forecast confidence will improve as more transaction history is analysed.",
    ],
  };
}

export function buildFinancialPosition(
  accounts: Account[],
  plan: MonthlyPlan,
  reserves: Reserve[] = [],
  referenceDate = new Date(),
): FinancialPosition {
  const availableToday = getAvailableCash(accounts);

  const allocations = buildAllocations(plan, reserves);

  const allocatedCash = getAllocatedCash(allocations);

  const knownCommitments = allocations
    .filter((allocation) => allocation.source === "commitment")
    .reduce((total, allocation) => total + allocation.amount, 0);

  const estimatedRemainingSpend = allocations
    .filter((allocation) => allocation.source === "forecast")
    .reduce((total, allocation) => total + allocation.amount, 0);

  const reservedCash = allocations
    .filter((allocation) => allocation.source === "reserve")
    .reduce((total, allocation) => total + allocation.amount, 0);

  const expectedIncome = plan.income.reduce(
    (total, item) => total + item.amount,
    0,
  );

  const safeToSpendBreakdown = buildSafeToSpendBreakdown({
    availableCash: availableToday,
    remainingCommitments: knownCommitments,
    reservedMoney: reservedCash,
    safetyBuffer: plan.safetyBuffer,
  });

  const safeToSpend = safeToSpendBreakdown.safeToSpend;

  const rawSafeToSpend =
    availableToday - knownCommitments - reservedCash - plan.safetyBuffer;

  const forecastSummary = buildForecastSummary({
    currentCash: availableToday,
    expectedIncome,
    remainingCommitments: knownCommitments,
    expectedRemainingSpend: estimatedRemainingSpend,
    reservedMoney: reservedCash,
  });

  const projectedMonthEnd = forecastSummary.projectedMonthEndBalance;

  const daysUntilPayday = getDaysUntilPayday(plan, referenceDate);

  const dailyBudget =
    daysUntilPayday > 0
      ? roundCurrency(safeToSpend / daysUntilPayday)
      : safeToSpend;

  const financialStatus = getFinancialStatus({
    safeToSpend: rawSafeToSpend,
    projectedMonthEnd,
    knownCommitments,
  });

  const breakdown: FinancialBreakdownRow[] = [
    {
      id: "available-today",
      label: "Available today",
      amount: availableToday,
      type: "starting",
    },
    {
      id: "known-commitments",
      label: "Known commitments",
      amount: -knownCommitments,
      type: "commitment",
    },
    {
      id: "reserved-money",
      label: "Reserved money",
      amount: -reservedCash,
      type: "reserve",
    },
    {
      id: "safety-buffer",
      label: "Safety buffer",
      amount: -plan.safetyBuffer,
      type: "buffer",
    },
    {
      id: "safe-to-spend",
      label: "Safe to spend",
      amount: safeToSpend,
      type: "result",
    },
  ];

  return {
    availableToday,
    allocations,
    allocatedCash,
    knownCommitments,
    estimatedRemainingSpend,
    reservedCash,
    safetyBuffer: plan.safetyBuffer,
    safeToSpend,
    expectedIncome,
    projectedMonthEnd,
    safeToSpendBreakdown,
    forecastSummary,
    daysUntilPayday,
    dailyBudget,
    breakdown,
    financialStatus,
  };
}
