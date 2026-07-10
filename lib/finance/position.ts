import type {
  Account,
  FinancialPosition,
  MonthlyPlan,
} from "./types";

function getAvailableCash(accounts: Account[]) {
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
    .filter((item) => item.mandatory)
    .reduce((total, item) => total + item.amount, 0);

  const estimatedRemainingSpend = plan.forecastItems
    .filter((item) => item.confidence !== "optional")
    .reduce((total, item) => total + item.amount, 0);

  const expectedIncome = plan.income.reduce(
    (total, item) => total + item.amount,
    0
  );

  const safeToSpend = Math.max(
    0,
    availableToday -
      knownCommitments -
      estimatedRemainingSpend -
      plan.safetyBuffer
  );

  const projectedMonthEnd =
    availableToday +
    expectedIncome -
    knownCommitments -
    estimatedRemainingSpend;

  return {
    availableToday,
    knownCommitments,
    estimatedRemainingSpend,
    safetyBuffer: plan.safetyBuffer,
    safeToSpend,
    expectedIncome,
    projectedMonthEnd,
  };
}