import {
  buildAllocations,
  getAllocatedCash,
} from "./allocations";
import { getFinancialStatus } from "./status";
import type {
  Account,
  FinancialBreakdownRow,
  FinancialPosition,
  MonthlyPlan,
  Reserve,
} from "./types";

export function getAvailableCash(
  accounts: Account[]
): number {
  return accounts
    .filter(
      (account) =>
        account.includeInAvailableCash &&
        account.currency === "EUR" &&
        account.type !== "credit_card"
    )
    .reduce(
      (total, account) =>
        total + account.balance,
      0
    );
}

export function buildFinancialPosition(
  accounts: Account[],
  plan: MonthlyPlan,
  reserves: Reserve[] = []
): FinancialPosition {
  const availableToday = getAvailableCash(accounts);

  const allocations = buildAllocations(
    plan,
    reserves
  );

  const allocatedCash = getAllocatedCash(allocations);

  const knownCommitments = allocations
    .filter(
      (allocation) =>
        allocation.source === "commitment"
    )
    .reduce(
      (total, allocation) =>
        total + allocation.amount,
      0
    );

  const estimatedRemainingSpend = allocations
    .filter(
      (allocation) =>
        allocation.source === "forecast"
    )
    .reduce(
      (total, allocation) =>
        total + allocation.amount,
      0
    );

  const reservedCash = allocations
    .filter(
      (allocation) =>
        allocation.source === "reserve"
    )
    .reduce(
      (total, allocation) =>
        total + allocation.amount,
      0
    );

  const expectedIncome = plan.income.reduce(
    (total, item) =>
      total + item.amount,
    0
  );

  const rawSafeToSpend =
    availableToday -
    allocatedCash -
    plan.safetyBuffer;

  const safeToSpend = Math.max(
    0,
    rawSafeToSpend
  );

  const projectedMonthEnd =
    availableToday +
    expectedIncome -
    allocatedCash;

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
    expectedIncome,
    projectedMonthEnd,
    breakdown,
    financialStatus,
  };
}