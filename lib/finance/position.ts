import { buildAllocations, getAllocatedCash } from "./allocations";
import { getFinancialStatus } from "./status";
import type {
  Account,
  FinancialBreakdownRow,
  FinancialPosition,
  IncomeItem,
  MonthlyPlan,
  Reserve,
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

  const rawSafeToSpend = availableToday - allocatedCash - plan.safetyBuffer;

  const safeToSpend = Math.max(0, rawSafeToSpend);

  const daysUntilPayday = getDaysUntilPayday(plan, referenceDate);

  const dailyBudget =
    daysUntilPayday > 0
      ? roundCurrency(safeToSpend / daysUntilPayday)
      : safeToSpend;

  const projectedMonthEnd = availableToday + expectedIncome - allocatedCash;

  const financialStatus = getFinancialStatus({
    safeToSpend: rawSafeToSpend,
    projectedMonthEnd,
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
      id: "forecast-spending",
      label: "Forecast spending",
      amount: -estimatedRemainingSpend,
      type: "forecast",
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
    daysUntilPayday,
    dailyBudget,
    expectedIncome,
    projectedMonthEnd,
    breakdown,
    financialStatus,
  };
}
