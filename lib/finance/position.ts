import { getFinancialStatus } from "./status";
import type {
  Account,
  FinancialPosition,
  MonthlyPlan,
} from "./types";

export function getAvailableCash(accounts: Account[]) {
  return accounts
    .filter(
      (account) =>
        account.includeInAvailableCash &&
        account.currency === "EUR" &&
        account.type !== "credit_card"
    )
    .reduce((total, account) => total + account.balance, 0);
}

export function buildFinancialPosition(
  accounts: Account[],
  plan: MonthlyPlan
): FinancialPosition {
  const availableToday = getAvailableCash(accounts);

  const knownCommitments = plan.commitments
    .filter(
      (item) =>
        item.mandatory &&
        item.status !== "paid" &&
        item.status !== "cancelled"
    )
    .reduce((total, item) => total + item.amount, 0);

  const estimatedRemainingSpend = plan.forecastItems
    .filter((item) => item.confidence !== "optional")
    .reduce((total, item) => total + item.amount, 0);

  const expectedIncome = plan.income.reduce(
    (total, item) => total + item.amount,
    0
  );

  const rawSafeToSpend =
    availableToday -
    knownCommitments -
    estimatedRemainingSpend -
    plan.safetyBuffer;

  const safeToSpend = Math.max(0, rawSafeToSpend);

  const projectedMonthEnd =
    availableToday +
    expectedIncome -
    knownCommitments -
    estimatedRemainingSpend;

  const financialStatus = getFinancialStatus({
    safeToSpend: rawSafeToSpend,
    projectedMonthEnd,
  });

  return {
    availableToday,
    knownCommitments,
    estimatedRemainingSpend,
    safetyBuffer: plan.safetyBuffer,
    safeToSpend,
    expectedIncome,
    projectedMonthEnd,
    financialStatus,
  };
}